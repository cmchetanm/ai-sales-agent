# frozen_string_literal: true

module Api
  module V1
    module Internal
      class BaseController < ApplicationController
        before_action :verify_internal_token

        private

        def verify_internal_token
          expected = ENV.fetch('INTERNAL_API_TOKEN', nil)
          provided = request.headers['X-Internal-Token']
          head :forbidden and return unless expected.present? && ActiveSupport::SecurityUtils.secure_compare(provided.to_s, expected.to_s)
        end
      end
    end
  end
end

