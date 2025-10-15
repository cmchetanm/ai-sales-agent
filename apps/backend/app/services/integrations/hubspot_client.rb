# frozen_string_literal: true

module Integrations
  class HubspotClient
    def initialize(api_key: ENV['HUBSPOT_API_KEY'])
      @api_key = api_key
    end
    def ready?
      @api_key.present?
    end

    def search_people(filters = {})
      return [] unless ready?
      # TODO: Implement real HubSpot search (Contacts API)
      []
    end
  end
end
