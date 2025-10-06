# frozen_string_literal: true

module Api
  module V1
    module Integrations
      class ApolloController < Api::BaseController
        def show
          client = Integrations::ApolloClient.new
          render json: {
            enabled: client.enabled?,
            has_key: ENV['APOLLO_API_KEY'].present?,
            ready: client.ready?,
            mode: client.ready? ? 'live' : 'sample'
          }
        end

        def create
          ApolloFetchJob.perform_later(account_id: current_account.id, filters: apollo_params)
          render json: { status: 'queued' }, status: :accepted
        end

        private

        def apollo_params
          params.require(:filters).permit(:keywords, :role, :location).to_h.symbolize_keys
        end
      end
    end
  end
end
