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
end
