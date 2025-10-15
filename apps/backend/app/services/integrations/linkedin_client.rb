# frozen_string_literal: true

module Integrations
  class LinkedinClient
    def initialize(api_key: ENV['LINKEDIN_SALES_NAVIGATOR_API_KEY'])
      @api_key = api_key
    end
    def ready?
      @api_key.present?
    end

    def search_people(filters = {})
      return [] unless ready?
      # TODO: Implement real LinkedIn Sales Navigator search when API access is available.
      []
    end
  end
end
