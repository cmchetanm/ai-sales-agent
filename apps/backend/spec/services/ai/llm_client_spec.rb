# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::LlmClient do
  it 'raises StrictError on non-success response' do
    client = described_class.new(base_url: 'http://example.test')
    fake = instance_double(Faraday::Connection)
    client.instance_variable_set(:@conn, fake)
    allow(fake).to receive(:post).and_return(double(success?: false, status: 422, body: { 'detail' => 'bad' }))
    expect {
      client.reply(session_id: 1, account_id: 1, user_id: 1, messages: [{ role: 'user', content: 'Hi' }])
    }.to raise_error(Ai::LlmClient::StrictError)
  end

  it 'raises StrictError on Faraday error' do
    client = described_class.new(base_url: 'http://example.test')
    fake = instance_double(Faraday::Connection)
    client.instance_variable_set(:@conn, fake)
    allow(fake).to receive(:post).and_raise(Faraday::ConnectionFailed.new('boom'))
    expect {
      client.reply(session_id: 1, account_id: 1, user_id: 1, messages: [])
    }.to raise_error(Ai::LlmClient::StrictError)
  end
end

