# frozen_string_literal: true

class ApplicationController < ActionController::API
  include Pagy::Backend
  include Pundit::Authorization

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActionController::ParameterMissing, with: :bad_request
  rescue_from ActionDispatch::Http::Parameters::ParseError, with: :bad_request

  private

  def user_not_authorized
    render json: { error: 'Not authorized' }, status: :forbidden
  end

  def record_not_found(error)
    render json: { error: 'Not Found', detail: error.message }, status: :not_found
  end

  def bad_request(error)
    render json: { error: 'Bad Request', detail: error.message }, status: :bad_request
  end
end
