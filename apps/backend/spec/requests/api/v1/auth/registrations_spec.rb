# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Auth Registrations', type: :request do
  let!(:plan) do
    Plan.find_or_create_by!(slug: 'basic') do |p|
      p.name = 'Basic'
      p.monthly_price_cents = 0
      p.limits = { 'leads_per_month' => 100 }
      p.features = { 'enabled' => %w[basic_campaigns] }
      p.active = true
    end
  end
  let(:headers) { { 'Content-Type' => 'application/json', 'Accept' => 'application/json' } }

  describe 'POST /api/v1/auth/sign_up' do
    it 'creates an account and owner user' do
      expect do
        post '/api/v1/auth/sign_up', params: {
        account: { name: 'Acme Inc', plan_slug: 'basic' },
        user: {
          email: 'owner@acme.test',
          password: 'SecurePass123!',
          password_confirmation: 'SecurePass123!',
          first_name: 'Ava',
          last_name: 'Owner'
        }
      }.to_json, headers: headers
      end.to change(Account, :count).by(1).and change(User, :count).by(1)

      expect(response).to have_http_status(:created)
      body = json_body
      expect(body['account']['name']).to eq('Acme Inc')
      expect(body['user']['email']).to eq('owner@acme.test')
      expect(body['token']).to be_present
      expect(Account.last.name).to eq('Acme Inc')
    end

    it 'returns errors when plan is missing' do
      post '/api/v1/auth/sign_up', params: {
        account: { name: 'Acme Inc', plan_slug: 'unknown' },
        user: {
          email: 'owner@acme.test',
          password: 'SecurePass123!',
          password_confirmation: 'SecurePass123!'
        }
      }.to_json, headers: headers

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_body['errors']).to include('Plan not provisioned')
    end
  end
end
