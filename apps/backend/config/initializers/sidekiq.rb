# frozen_string_literal: true

require 'sidekiq'

def safe_redis_url
  raw = ENV['REDIS_URL'].to_s
  # Treat unresolved placeholders or empty/malformed values as missing
  if raw.blank? || raw.include?('${') || raw !~ %r{\A(rediss?|redis)://}
    return ENV['REDIS_URL_DEFAULT'].presence || 'redis://localhost:6379/0'
  end
  raw
end

Sidekiq.configure_server do |config|
  config.redis = { url: safe_redis_url, network_timeout: 5 }
end

Sidekiq.configure_client do |config|
  config.redis = { url: safe_redis_url, network_timeout: 5 }
end
