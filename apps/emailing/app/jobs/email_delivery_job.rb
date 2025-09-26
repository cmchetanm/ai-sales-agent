# frozen_string_literal: true

require 'net/http'
require 'uri'

class EmailDeliveryJob < ApplicationJob
  queue_as :default

  def perform(message_id:)
    msg = EmailMessage.find_by(id: message_id)
    return unless msg && msg.status == 'queued'

    # Simulate sending: mark as delivered and post event back to backend
    msg.update!(status: 'delivered', sent_at: (msg.sent_at || Time.current))
    post_event!(msg, 'delivered')
  rescue StandardError
    # swallow to avoid retries storm; production could retry_on
  end

  private

  def post_event!(msg, status)
    base = ENV.fetch('BACKEND_INTERNAL_URL', 'http://backend:3000')
    token = ENV['INTERNAL_API_TOKEN']
    return unless token
    uri = URI.parse("#{base}/api/v1/internal/email_event")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == 'https'
    req = Net::HTTP::Post.new(uri.request_uri, { 'Content-Type' => 'application/json', 'X-Internal-Token' => token })
    req.body = { message_id: msg.id, status: status }.to_json
    http.request(req)
  end
end

