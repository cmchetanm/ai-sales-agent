# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Auth Profile', type: :request do
  let(:user) { create(:user) }

  it 'returns current user profile when authenticated' do
    get '/api/v1/auth/profile', headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_body['user']['email']).to eq(user.email)
    expect(json_body['account']['id']).to eq(user.account_id)
  end

  it 'returns unauthorized without token' do
    get '/api/v1/auth/profile'

    expect(response).to have_http_status(:unauthorized)
  end
end
