# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Integrations Status', type: :request do
  it 'is accessible without auth and returns apollo status' do
    get '/api/v1/integrations/status'
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body['apollo']).to be_a(Hash)
    expect(body['apollo']).to have_key('mode')
  end
end

