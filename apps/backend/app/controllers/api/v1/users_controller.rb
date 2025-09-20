# frozen_string_literal: true

module Api
  module V1
    class UsersController < Api::BaseController
      def index
        scope = policy_scope(current_account.users)
        if params[:q].present?
          q = "%#{params[:q].to_s.downcase}%"
          scope = scope.where('LOWER(email) LIKE :q OR LOWER(first_name) LIKE :q OR LOWER(last_name) LIKE :q', q:)
        end
        render json: { users: scope.order(:first_name, :last_name).map { |u| UserSerializer.new(u).serializable_hash } }
      end
    end
  end
end

