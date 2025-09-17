# frozen_string_literal: true

Rails.application.configure do
  next unless Rails.logger

  config.lograge.enabled = true if Rails.env.production? || ENV["ENABLE_LOGRAGE"] == "true"
  config.lograge.formatter = Lograge::Formatters::Json.new
  config.lograge.custom_options = lambda do |event|
    {
      time: Time.zone.now,
      request_id: event.payload[:request_id],
      user_id: event.payload[:user_id]
    }.compact
  end
end
