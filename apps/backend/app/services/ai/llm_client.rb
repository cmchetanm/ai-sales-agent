# frozen_string_literal: true

require 'faraday'

module Ai
  class LlmClient
    def initialize(base_url: ENV.fetch('LLM_SERVICE_URL', 'http://llm_service:8000'))
      @conn = Faraday.new(url: base_url) do |f|
        f.request :json
        f.response :json, content_type: /json/
        f.adapter Faraday.default_adapter
      end
    end

    def reply(session_id:, account_id:, user_id:, messages: [])
      payload = {
        session_id: session_id,
        account_id: account_id,
        user_id: user_id,
        messages: messages.map { |m| { role: m[:role], content: m[:content].to_s } }
      }
      resp = @conn.post('/chat/messages', payload)
      raise(StandardError, "LLM service error: #{resp.status}") unless resp.success?

      resp.body.fetch('reply')
    rescue Faraday::Error => e
      Rails.logger.error("LLM error: #{e.message}")
      'Sorry, I had trouble thinking just now. Could you rephrase?'
    end
  end
end

