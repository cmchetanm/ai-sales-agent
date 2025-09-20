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
        session_id: session_id.to_s,
        account_id: account_id,
        user_id: user_id,
        messages: messages.map { |m| { role: m[:role], content: m[:content].to_s } }
      }
      resp = @conn.post('/chat/messages', payload) do |req|
        # Propagate locale so the LLM service can localize replies
        begin
          req.headers['Accept-Language'] = I18n.locale.to_s
        rescue StandardError
          # ignore if I18n not available in context
        end
      end
      return resp.body.fetch('reply') if resp.success?

      # Gracefully degrade on validation/422 or other non-200s
      detail = begin
        b = resp.body
        b.is_a?(Hash) ? b['detail'] || b : b
      rescue StandardError
        nil
      end
      Rails.logger.warn("LLM service non-success #{resp.status}: #{detail}")
      'Noted. Could you clarify industry, roles, and geography?'
    rescue Faraday::Error => e
      Rails.logger.error("LLM error: #{e.message}")
      'Sorry, I had trouble thinking just now. Could you rephrase?'
    end
  end
end
