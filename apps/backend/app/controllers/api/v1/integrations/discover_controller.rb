# frozen_string_literal: true

module Api
  module V1
    module Integrations
      class DiscoverController < Api::BaseController
        def create
          LeadDiscoveryJob.perform_later(account_id: current_account.id, filters: discover_params)
          render json: { status: 'queued' }, status: :accepted
        end

        private

        def discover_params
          params.require(:filters).permit(:keywords, :role, :location).to_h.symbolize_keys
        end
      end
    end
  end
end

