# frozen_string_literal: true

if defined?(Rack::Attack)
  Rack::Attack.enabled = ENV.fetch('RACK_ATTACK_ENABLED', (Rails.env.production? ? 'true' : 'false')).casecmp?('true')

  # Safelist localhost and healthchecks
  Rack::Attack.safelist('allow-localhost') do |req|
    ['127.0.0.1', '::1', 'localhost'].include?(req.ip) || req.path.start_with?('/health', '/api/v1/health', '/up')
  end

  # Throttle general requests by IP: 100 req/min
  Rack::Attack.throttle('req/ip', limit: 100, period: 60) do |req|
    req.ip unless req.path.start_with?('/assets')
  end

  # Throttle login attempts: 5 per 20s per IP
  Rack::Attack.throttle('logins/ip', limit: 5, period: 20) do |req|
    req.ip if req.post? && req.path == '/api/v1/auth/sign_in'
  end

  # Throttle signups: 3 per minute per IP
  Rack::Attack.throttle('signups/ip', limit: 3, period: 60) do |req|
    req.ip if req.post? && req.path == '/api/v1/auth/sign_up'
  end

  # Return JSON for throttled requests (modern API)
  Rack::Attack.throttled_responder = lambda do |_env|
    [
      429,
      { 'Content-Type' => 'application/json' },
      [{ error: 'Too Many Requests' }.to_json]
    ]
  end
end
