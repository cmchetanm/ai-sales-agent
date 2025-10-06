# frozen_string_literal: true

module Api
  module V1
    module Integrations
      class StatusController < Api::BaseController
        def show
          apollo = ::Integrations::ApolloClient.new
          render json: {
            apollo: {
              enabled: apollo.enabled?,
              has_key: ENV['APOLLO_API_KEY'].present?,
              ready: apollo.ready?,
              mode: apollo.ready? ? 'live' : 'sample'
            }
          }
        end
      end
    end
  end
end
