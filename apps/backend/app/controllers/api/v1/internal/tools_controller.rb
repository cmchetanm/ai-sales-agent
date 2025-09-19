# frozen_string_literal: true

module Api
  module V1
    module Internal
      class ToolsController < BaseController
        def profile_update
          account = Account.find(params.require(:account_id))
          account.create_profile unless account.profile
          profile_attrs = params.require(:profile).permit(:summary, target_industries: [], target_roles: [], target_locations: [], ideal_customer_profile: {}, questionnaire: {})
          account.profile.update!(profile_attrs)
          render json: { status: 'ok' }
        end

      def apollo_fetch
        account = Account.find(params.require(:account_id))
        filters = params.require(:filters).permit(:keywords, :role, :location).to_h.symbolize_keys
        ApolloFetchJob.perform_later(account_id: account.id, filters:)
        render json: { status: 'queued' }, status: :accepted
      end

      def discover_leads
        account = Account.find(params.require(:account_id))
        filters = params.require(:filters).permit(:keywords, :role, :location).to_h.symbolize_keys
        LeadDiscoveryJob.perform_later(account_id: account.id, filters:)
        render json: { status: 'queued' }, status: :accepted
      end
      end
    end
  end
end
