# frozen_string_literal: true

module Api
  module V1
    module Auth
      class ProfilesController < Api::BaseController
        def show
          render json: {
            user: UserSerializer.new(current_user).serializable_hash,
            account: AccountSerializer.new(current_account).serializable_hash
          }
        end
      end
    end
  end
end
