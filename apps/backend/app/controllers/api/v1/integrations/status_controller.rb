# frozen_string_literal: true

module Api
  module V1
    module Integrations
      class StatusController < Api::BaseController
        skip_before_action :authenticate_user!, raise: false
        def show
          apollo = ::Integrations::ApolloClient.new
          data = {
            enabled: apollo.enabled?,
            has_key: ENV['APOLLO_API_KEY'].present?,
            ready: apollo.ready?,
            mode: apollo.ready? ? 'live' : 'sample'
          }
          if params[:probe].present? && !Rails.env.test?
            pr = apollo.probe
            data[:probe] = pr
            if pr[:status] == 401
              data[:mode] = 'unauthorized'
            end
          end
          render json: { apollo: data }
        end
      end
    end
  end
end
