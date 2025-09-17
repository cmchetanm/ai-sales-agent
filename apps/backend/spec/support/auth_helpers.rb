# frozen_string_literal: true

module AuthHelpers
  def auth_headers(user, headers: {})
    default_headers = {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }

    Devise::JWT::TestHelpers.auth_headers(default_headers.merge(headers), user)
  end
end
