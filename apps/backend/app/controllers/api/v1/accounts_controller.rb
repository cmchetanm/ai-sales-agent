# frozen_string_literal: true

module Api
  module V1
    class AccountsController < Api::BaseController
      def show
        authorize current_account, :show?
        render json: { account: AccountSerializer.new(current_account).serializable_hash }
      end

      def update
        authorize current_account, :update?
        if current_account.update(account_params)
          render json: { account: AccountSerializer.new(current_account).serializable_hash }
        else
          render json: { errors: current_account.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def account_params
        params.require(:account).permit(
          :name,
          settings: {},
          profile_attributes: [
            :id,
            :summary,
            { target_industries: [], target_roles: [], target_locations: [], ideal_customer_profile: {}, questionnaire: {} }
          ]
        )
      end
    end
  end
end
