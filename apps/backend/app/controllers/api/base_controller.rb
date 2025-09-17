# frozen_string_literal: true

module Api
  class BaseController < ApplicationController
    before_action :set_request_format

    private

    def set_request_format
      request.format = :json
    end
  end
end
