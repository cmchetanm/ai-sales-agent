# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Integrations::ApolloClient do
  describe '#search_people' do
    it 'maps Apollo API people to lead attributes' do
      stub_request(:post, 'https://api.apollo.io/api/v1/mixed_people/search')
        .with { |req|
          body = JSON.parse(req.body)
          body['q_keywords'] == 'saas'
        }
        .to_return(
          status: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: {
            people: [
              {
                'first_name' => 'Jane',
                'last_name' => 'Doe',
                'email' => 'jane@example.com',
                'organization' => { 'name' => 'Acme Inc' }
              }
            ]
          }.to_json
        )

      client = described_class.new(api_key: 'test-key', enabled: true)
      results = client.search_people(keywords: 'saas', limit: 1)

      expect(results.size).to eq(1)
      expect(results.first).to include(first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', company: 'Acme Inc')
      # New mapping may add optional fields like enrichment/source
      expect(results.first[:source]).to eq('apollo')
    end
  end
end
