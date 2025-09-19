# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'I18n behavior', type: :request do
  it 'localizes error messages via Accept-Language' do
    user = create(:user)
    get '/api/v1/leads/999999', headers: auth_headers(user, headers: { 'Accept-Language' => 'es' })
    expect(response).to have_http_status(:not_found)
    body = JSON.parse(response.body)
    expect(body['error']).to eq('No encontrado')
  end
end
