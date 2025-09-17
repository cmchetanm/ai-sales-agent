# frozen_string_literal: true

class ApplicationController < ActionController::API
  include Pagy::Backend
  include Pundit::Authorization

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  private

  def user_not_authorized
    render json: { error: 'Not authorized' }, status: :forbidden
  end
end
