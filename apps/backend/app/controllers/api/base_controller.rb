# frozen_string_literal: true

module Api
  class BaseController < ApplicationController
    before_action :authenticate_user!
    before_action :set_request_format

    private

    def current_account
      current_user.account
    end

    def set_request_format
      request.format = :json
    end
  end
end
