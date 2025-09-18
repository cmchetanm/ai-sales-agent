# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Plans', type: :request do
  it 'lists active plans' do
    create_list(:plan, 2, active: true)

    get '/api/v1/plans'
    expect(response).to have_http_status(:ok)
    expect(json_body['plans'].size).to be >= 2
  end
end
