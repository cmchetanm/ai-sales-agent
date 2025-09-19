# frozen_string_literal: true

module Integrations
  class SalesforceClient
    def initialize(client_id: ENV['SALESFORCE_CLIENT_ID'])
      @client_id = client_id
    end

    def search_people(filters = {})
      return sample_results(filters) unless ready?
      # TODO: Implement real Salesforce SOQL query when credentials are provided.
      sample_results(filters)
    end

    private

    def ready?
      @client_id.present?
    end

    def sample_results(filters)
      seed = (filters[:keywords].to_s + filters[:role].to_s).hash % 1000
      [
        { first_name: 'Sally', last_name: 'Force', email: "sally#{seed}@example.com", company: 'SFDC Corp', source: 'salesforce' }
      ]
    end
  end
end

