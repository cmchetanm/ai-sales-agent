# frozen_string_literal: true

module JsonHelpers
  def json_body
    raise 'response not available' unless respond_to?(:response)

    JSON.parse(response.body)
  end
end
