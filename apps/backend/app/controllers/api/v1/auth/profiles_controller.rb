# frozen_string_literal: true

module Api
  module V1
    module Auth
      class ProfilesController < Api::BaseController
        def show
          render json: {
            user: UserSerializer.new(current_user).serializable_hash[:data][:attributes],
            account: {
              id: current_account.id,
              name: current_account.name,
              plan: current_account.plan.slug
            }
          }
        end
      end
    end
  end
end
