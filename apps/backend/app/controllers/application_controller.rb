# frozen_string_literal: true

class ApplicationController < ActionController::API
  include Pagy::Backend
  include Pundit::Authorization

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActionController::ParameterMissing, with: :bad_request
  rescue_from ActionDispatch::Http::Parameters::ParseError, with: :bad_request

  before_action :set_locale

  private

  def user_not_authorized
    render json: { error: I18n.t('errors.not_authorized') }, status: :forbidden
  end

  def record_not_found(error)
    render json: { error: I18n.t('errors.not_found'), detail: error.message }, status: :not_found
  end

  def bad_request(error)
    render json: { error: I18n.t('errors.bad_request'), detail: error.message }, status: :bad_request
  end

  def set_locale
    I18n.locale = locale_from_params || locale_from_header || I18n.default_locale
  rescue StandardError
    I18n.locale = I18n.default_locale
  end

  def locale_from_params
    l = params[:locale].presence
    return l.to_sym if l && I18n.available_locales.include?(l.to_sym)
  end

  def locale_from_header
    hdr = request.headers['Accept-Language']
    return nil unless hdr
    code = hdr.to_s.split(',').map { |x| x.split(';').first }.find { |c| I18n.available_locales.include?(c.to_sym) }
    code&.to_sym
  end
end
