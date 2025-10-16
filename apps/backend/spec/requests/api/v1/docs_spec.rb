# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Docs', type: :request do
  it 'serves openapi.yaml' do
    get '/api/v1/openapi.yaml'
    expect(response).to have_http_status(:ok)
    expect(response.headers['Content-Type']).to include('yaml')
  end

  it 'serves swagger ui endpoint' do
    get '/api/v1/api-docs'
    expect(response).to have_http_status(:ok)
  end
end

