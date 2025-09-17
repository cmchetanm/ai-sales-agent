# frozen_string_literal: true

allowed_origins = ENV.fetch("CORS_ORIGINS", "*")
origin_list = allowed_origins.split(",").map(&:strip)
allow_credentials = ENV.fetch("CORS_ALLOW_CREDENTIALS", "true").casecmp?("true")
credentials_enabled = allow_credentials && !origin_list.include?("*")

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*origin_list)

    resource "*",
             headers: :any,
             methods: %i[get post put patch delete options head],
             expose: ["Authorization"],
             credentials: credentials_enabled
  end
end
