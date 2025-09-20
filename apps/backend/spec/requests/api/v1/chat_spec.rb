# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Chat', type: :request do
  let(:account) { create(:account) }
  let(:user) { create(:user, account:) }

  before do
    stub_request(:post, %r{llm_service:8000/chat/messages|/chat/messages}).to_return(
      status: 200,
      body: { reply: 'Hello from LLM', session_id: 'x' }.to_json,
      headers: { 'Content-Type' => 'application/json' }
    )
  end

  it 'creates a chat session and exchanges a message' do
    post '/api/v1/chat_sessions', headers: auth_headers(user)
    expect(response).to have_http_status(:created)
    id = json_body['chat_session']['id']

    post "/api/v1/chat_sessions/#{id}/messages", headers: auth_headers(user), params: { message: { content: 'Hi' } }.to_json
    expect(response).to have_http_status(:created)
    expect(json_body['assistant']['content']).to eq('Hello from LLM')
  end

  it 'lists messages and shows session' do
    post '/api/v1/chat_sessions', headers: auth_headers(user)
    id = json_body['chat_session']['id']

    stub_request(:post, %r{/chat/messages}).to_return(status: 200, body: { reply: 'Howdy', session_id: id }.to_json, headers: { 'Content-Type' => 'application/json' })

    post "/api/v1/chat_sessions/#{id}/messages", headers: auth_headers(user), params: { message: { content: 'First' } }.to_json
    expect(response).to have_http_status(:created)

    get "/api/v1/chat_sessions/#{id}", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['chat_session']['messages'].size).to be >= 1

    get "/api/v1/chat_sessions/#{id}/messages", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['messages'].first).to have_key('content')
  end

  it 'gracefully handles 422 from llm service' do
    post '/api/v1/chat_sessions', headers: auth_headers(user)
    id = json_body['chat_session']['id']

    stub_request(:post, %r{/chat/messages}).to_return(status: 422, body: { detail: 'validation error' }.to_json, headers: { 'Content-Type' => 'application/json' })

    post "/api/v1/chat_sessions/#{id}/messages", headers: auth_headers(user), params: { message: { content: 'Hi' } }.to_json
    expect(response).to have_http_status(:created)
    expect(json_body['assistant']['content']).to match(/industry|roles|geography/i)
  end

  it 'forwards Accept-Language to the LLM service' do
    post '/api/v1/chat_sessions', headers: auth_headers(user)
    id = json_body['chat_session']['id']

    # Make a request with a specific locale and then assert LLM call used it
    post "/api/v1/chat_sessions/#{id}/messages",
         headers: auth_headers(user, headers: { 'Accept-Language' => 'es' }),
         params: { message: { content: 'Hola' } }.to_json

    expect(response).to have_http_status(:created)
    expect(a_request(:post, %r{/chat/messages}).with { |req| req.headers['Accept-Language'] == 'es' }).to have_been_made
  end

  it 'limits LLM context to the last 20 messages in chronological order' do
    post '/api/v1/chat_sessions', headers: auth_headers(user)
    id = json_body['chat_session']['id']
    session = ChatSession.find(id)

    # Pre-populate 25 alternating messages (older to newer)
    25.times do |i|
      session.chat_messages.create!(
        sender_type: (i.even? ? 'User' : 'Assistant'),
        content: "msg#{i + 1}",
        sent_at: Time.current - (25 - i).minutes,
        created_at: Time.current - (25 - i).minutes,
        updated_at: Time.current - (25 - i).minutes
      )
    end

    # Trigger one more user message; controller recomputes context after creating this
    post "/api/v1/chat_sessions/#{id}/messages", headers: auth_headers(user), params: { message: { content: 'Final' } }.to_json
    expect(response).to have_http_status(:created)

    # Assert the LLM received only 20 messages: msg7..msg25 and then 'Final', in that order
    expect(
      a_request(:post, %r{/chat/messages}).with do |req|
        body = JSON.parse(req.body) rescue {}
        msgs = Array(body['messages'])
        next false unless msgs.size == 20
        first = msgs.first
        last = msgs.last
        first['content'] == 'msg7' && last['content'] == 'Final'
      end
    ).to have_been_made
  end
end
