# frozen_string_literal: true

module Integrations
  class LinkedinClient
    def initialize(api_key: ENV['LINKEDIN_SALES_NAVIGATOR_API_KEY'])
      @api_key = api_key
    end

    def search_people(filters = {})
      return sample_results(filters) unless @api_key.present?
      # TODO: Implement real LinkedIn Sales Navigator search when API access is available.
      sample_results(filters)
    end

    private

    def sample_results(filters)
      seed = (filters[:keywords].to_s + filters[:role].to_s).hash % 1000
      [
        { first_name: 'Lina', last_name: 'Navarro', email: "lina#{seed}@example.com", company: 'Navigator Co', source: 'linkedin' },
        { first_name: 'Ivan', last_name: 'Ghosh', email: "ivan#{seed}@example.com", company: 'Growth Labs', source: 'linkedin' }
      ]
    end
  end
end

