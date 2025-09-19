class ApplicationController < ActionController::API
  before_action :set_locale

  private

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
