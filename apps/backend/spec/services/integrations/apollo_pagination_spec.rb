# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Integrations::ApolloClient do
  it 'paginates until desired limit is reached' do
    stub_request(:post, 'https://api.apollo.io/v1/mixed_people/search')
      .with { |req| JSON.parse(req.body)['page'] == 1 }
      .to_return(status: 200, headers: { 'Content-Type' => 'application/json' }, body: {
        people: [
          { 'first_name' => 'P1', 'last_name' => 'A', 'email' => 'p1@example.com', 'organization' => { 'name' => 'Acme' } },
          { 'first_name' => 'P2', 'last_name' => 'B', 'email' => 'p2@example.com', 'organization' => { 'name' => 'Acme' } }
        ]
      }.to_json)

    stub_request(:post, 'https://api.apollo.io/v1/mixed_people/search')
      .with { |req| JSON.parse(req.body)['page'] == 2 }
      .to_return(status: 200, headers: { 'Content-Type' => 'application/json' }, body: {
        people: [
          { 'first_name' => 'P3', 'last_name' => 'C', 'email' => 'p3@example.com', 'organization' => { 'name' => 'Beta' } }
        ]
      }.to_json)

    client = described_class.new(api_key: 'test-key', enabled: true)
    results = client.search_people(keywords: 'saas', limit: 3)
    expect(results.size).to eq(3)
    expect(results.map { |r| r[:email] }).to include('p1@example.com', 'p2@example.com', 'p3@example.com')
  end

  it 'retries on 429 responses' do
    # First call 429, second call 200
    calls = 0
    stub_request(:post, 'https://api.apollo.io/v1/mixed_people/search')
      .to_return do
        calls += 1
        if calls == 1
          { status: 429, body: { error: 'rate_limited' }.to_json, headers: { 'Content-Type' => 'application/json' } }
        else
          { status: 200, body: { people: [{ 'first_name' => 'X', 'last_name' => 'Y', 'email' => 'x@example.com', 'organization' => { 'name' => 'Z' } }] }.to_json, headers: { 'Content-Type' => 'application/json' } }
        end
      end

    client = described_class.new(api_key: 'test-key', enabled: true)
    results = client.search_people(keywords: 'ai', limit: 1)
    expect(results.size).to eq(1)
  end
end

