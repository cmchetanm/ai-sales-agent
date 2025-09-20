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
           params: { lead: { pipeline_id: pipeline.id, first_name: 'Lee', last_name: 'D', email: 'lee@example.com', status: 'new' } }.to_json

      expect(response).to have_http_status(:created)
      lid = json_body['lead']['id']

      # show
      get "/api/v1/leads/#{lid}", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(json_body['lead']['email']).to eq('lee@example.com')

      # update
      patch "/api/v1/leads/#{lid}", headers: auth_headers(user), params: { lead: { status: 'enriched' } }.to_json
      expect(response).to have_http_status(:ok)
      expect(json_body['lead']['status']).to eq('enriched')

      # delete
      delete "/api/v1/leads/#{lid}", headers: auth_headers(user)
      expect(response).to have_http_status(:no_content)
    end

    it 'forbids create for viewer' do
      viewer = create(:user, account:, role: 'viewer')
      post '/api/v1/leads', headers: auth_headers(viewer), params: { lead: { pipeline_id: pipeline.id, email: 'v@example.com' } }.to_json
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'Filters and sorting' do
    let!(:lead_a) { create(:lead, account:, pipeline:, email: 'a@example.com', company: 'Alpha', status: 'new', score: 10) }
    let!(:lead_b) { create(:lead, account:, pipeline:, email: 'b@example.com', company: 'Beta', status: 'responded', score: 90, last_contacted_at: 1.day.ago) }
    let!(:lead_c) { create(:lead, account:, pipeline:, email: 'c@example.com', company: 'Gamma', status: 'outreach', score: 50) }

    it 'searches by q across email/company and filters by status' do
      get "/api/v1/leads", headers: auth_headers(user), params: { q: 'beta', status: 'responded' }
      expect(response).to have_http_status(:ok)
      emails = json_body['leads'].map { |l| l['email'] }
      expect(emails).to eq(['b@example.com'])
    end

    it 'sorts by score desc and supports updated bounds' do
      lead_a.update!(updated_at: 3.days.ago)
      lead_b.update!(updated_at: 1.day.ago)
      get "/api/v1/leads", headers: auth_headers(user), params: { order_by: 'score', order: 'desc', updated_after: 4.days.ago.iso8601 }
      expect(response).to have_http_status(:ok)
      emails = json_body['leads'].map { |l| l['email'] }
      expect(emails.first).to eq('b@example.com')
    end
  end
end
