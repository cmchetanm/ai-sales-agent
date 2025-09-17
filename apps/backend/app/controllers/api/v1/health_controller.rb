# frozen_string_literal: true

module Api
  module V1
    class HealthController < Api::BaseController
      skip_before_action :authenticate_user!

      def show
        render json: {
          status: "ok",
          timestamp: Time.zone.now
        }
      end
    end
  end
end
