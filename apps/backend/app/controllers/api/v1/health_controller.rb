# frozen_string_literal: true

module Api
  module V1
    class HealthController < Api::BaseController
      def show
        render json: {
          status: "ok",
          timestamp: Time.zone.now
        }
      end
    end
  end
end
