# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Auth Sessions', type: :request do
  let(:password) { 'SecurePass123!' }
  let(:user) { create(:user, password:, password_confirmation: password) }
  let(:headers) { { 'Content-Type' => 'application/json', 'Accept' => 'application/json' } }

  describe 'POST /api/v1/auth/sign_in' do
    it 'returns a jwt token on success' do
      post '/api/v1/auth/sign_in', params: {
        user: { email: user.email, password: password }
      }.to_json, headers: headers

      expect(response).to have_http_status(:ok)
      expect(json_body['token']).to be_present
      expect(json_body['user']['email']).to eq(user.email)
    end

    it 'returns unauthorized for invalid credentials' do
      post '/api/v1/auth/sign_in', params: {
        user: { email: user.email, password: 'wrong-password' }
      }.to_json, headers: headers

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'DELETE /api/v1/auth/sign_out' do
    it 'revokes the token' do
      auth_header = auth_headers(user)

      delete '/api/v1/auth/sign_out', headers: auth_header

      expect(response).to have_http_status(:no_content)
    end
  end
end
