# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Leads', type: :request do
  let!(:plan) { create(:plan) }
  let!(:account) { create(:account, plan:) }
  let!(:user) { create(:user, account:) }
  let!(:pipeline) { create(:pipeline, account:) }

  describe 'CRUD' do
    it 'creates, shows, updates, and deletes a lead' do
      # create
      post '/api/v1/leads',
           headers: auth_headers(user),
           params: { lead: { pipeline_id: pipeline.id, first_name: 'Lee', last_name: 'D', email: 'lee@example.com', status: 'new' } }

      expect(response).to have_http_status(:created)
      lid = json_body['lead']['id']

      # show
      get "/api/v1/leads/#{lid}", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(json_body['lead']['email']).to eq('lee@example.com')

      # update
      patch "/api/v1/leads/#{lid}", headers: auth_headers(user), params: { lead: { status: 'enriched' } }
      expect(response).to have_http_status(:ok)
      expect(json_body['lead']['status']).to eq('enriched')

      # delete
      delete "/api/v1/leads/#{lid}", headers: auth_headers(user)
      expect(response).to have_http_status(:no_content)
    end
  end
end

