# frozen_string_literal: true

module Api
  module V1
    module Internal
      class BaseController < ApplicationController
        before_action :verify_internal_token

        private

        def verify_internal_token
          provided = request.headers['X-Internal-Token']
          expected_env = ENV.fetch('INTERNAL_API_TOKEN', nil)
          allowed = []
          allowed << expected_env if expected_env.present?
          allowed << 'dev-internal-token' unless Rails.env.production?
          ok = allowed.any? { |tok| ActiveSupport::SecurityUtils.secure_compare(provided.to_s, tok.to_s) }
          head :forbidden and return unless ok
        end
      end
    end
  end
end
