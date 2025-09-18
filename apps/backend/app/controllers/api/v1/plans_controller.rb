# frozen_string_literal: true

module Api
  module V1
    class PlansController < Api::BaseController
      skip_before_action :authenticate_user!

      def index
        plans = Plan.active.order(:monthly_price_cents)
        render json: { plans: plans.map { |plan| PlanSerializer.new(plan).serializable_hash } }
      end
    end
  end
end
