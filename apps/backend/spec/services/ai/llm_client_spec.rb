# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::LlmClient do
  let(:client) { described_class.new(base_url: 'http://llm_service:8000') }

  it 'returns reply when service responds' do
    stub_request(:post, %r{llm_service:8000/chat/messages}).to_return(
      status: 200,
      body: { reply: 'Hello', session_id: 'x' }.to_json,
      headers: { 'Content-Type' => 'application/json' }
    )

    out = client.reply(session_id: 'x', account_id: 1, user_id: 1, messages: [])
    expect(out).to eq('Hello')
  end

  it 'raises StrictError on network errors (AI-only mode)' do
    stub_request(:post, %r{llm_service:8000/chat/messages}).to_timeout

    expect {
      client.reply(session_id: 'x', account_id: 1, user_id: 1, messages: [])
    }.to raise_error(Ai::LlmClient::StrictError)
  end
end
