# frozen_string_literal: true

module Integrations
  class HubspotClient
    def initialize(api_key: ENV['HUBSPOT_API_KEY'])
      @api_key = api_key
    end

    def search_people(filters = {})
      return sample_results(filters) unless @api_key.present?
      # TODO: Implement real HubSpot search (Contacts API)
      sample_results(filters)
    end

    private

    def sample_results(filters)
      seed = (filters[:keywords].to_s + filters[:role].to_s).hash % 1000
      [
        { first_name: 'Hugh', last_name: 'Spot', email: "hugh#{seed}@example.com", company: 'Hub Factory', source: 'hubspot' }
      ]
    end
  end
end

