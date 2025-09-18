# frozen_string_literal: true

require 'faraday'

module Integrations
  class ApolloClient
    API_BASE = 'https://api.apollo.io/v1'.freeze

    def initialize(api_key: ENV['APOLLO_API_KEY'])
      @api_key = api_key
      @conn = Faraday.new(url: API_BASE) do |f|
        f.request :json
        f.response :json, content_type: /json/
        f.adapter Faraday.default_adapter
      end if @api_key.present?
    end

    def search_people(filters = {})
      return sample_results(filters) unless @api_key.present?

      # Placeholder for real Apollo call; structure kept for easy swap-in.
      # resp = @conn.post('/mixed_people/search', { api_key: @api_key, q_keywords: filters[:keywords] }.compact)
      # return map_results(resp.body)
      sample_results(filters)
    rescue Faraday::Error => e
      Rails.logger.warn("Apollo search error: #{e.message}")
      sample_results(filters)
    end

    private

    def sample_results(filters)
      seed = (filters[:keywords].to_s + filters[:role].to_s).hash % 1000
      [
        { first_name: 'Ava', last_name: 'Lee',  email: "ava.#{seed}@example.com", company: 'Example Co' },
        { first_name: 'Ben', last_name: 'Kim',  email: "ben.#{seed}@example.com", company: 'Sample LLC' },
        { first_name: 'Cara', last_name: 'Diaz', email: "cara.#{seed}@example.com", company: 'Acme Inc' }
      ]
    end
  end
end

