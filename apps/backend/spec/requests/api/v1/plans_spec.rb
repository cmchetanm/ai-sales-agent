# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Plans', type: :request do
  it 'lists active plans' do
    create(:plan, name: 'Basic', slug: 'basic', active: true)
    create(:plan, name: 'Pro', slug: 'pro', active: true)

    get '/api/v1/plans'
    expect(response).to have_http_status(:ok)
    expect(json_body['plans'].size).to be >= 2
  end
end

