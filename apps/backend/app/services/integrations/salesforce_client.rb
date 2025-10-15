# frozen_string_literal: true

module Integrations
  class SalesforceClient
    def initialize(client_id: ENV['SALESFORCE_CLIENT_ID'])
      @client_id = client_id
    end

    def search_people(filters = {})
      return [] unless ready?
      # TODO: Implement real Salesforce SOQL query when credentials are provided.
      []
    end

    private

    def ready?
      @client_id.present?
    end
  end
end
