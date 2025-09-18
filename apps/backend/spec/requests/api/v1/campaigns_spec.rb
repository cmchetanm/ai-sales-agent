# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Campaigns', type: :request do
  let!(:plan) { create(:plan) }
  let!(:account) { create(:account, plan:) }
  let!(:user) { create(:user, account:) }
  let!(:pipeline) { create(:pipeline, account:) }

  let!(:campaign1) { create(:campaign, account:, pipeline:, name: 'Welcome Series', status: 'draft') }
  let!(:campaign2) { create(:campaign, account:, pipeline:, name: 'Q4 Outreach', status: 'scheduled') }

  let!(:other_account) { create(:account, plan:) }
  let!(:other_campaign) { create(:campaign, account: other_account) }

  describe 'GET /api/v1/campaigns' do
    it 'lists campaigns for current account only' do
      get '/api/v1/campaigns', headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      ids = json_body['campaigns'].map { |c| c['id'] }
      expect(ids).to include(campaign1.id, campaign2.id)
      expect(ids).not_to include(other_campaign.id)
    end

    it 'filters by pipeline_id when provided' do
      another_pipeline = create(:pipeline, account: account)
      _other_campaign_in_same_account = create(:campaign, account: account, pipeline: another_pipeline)

      get "/api/v1/campaigns?pipeline_id=#{pipeline.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      ids = json_body['campaigns'].map { |c| c['id'] }
      expect(ids).to contain_exactly(campaign1.id, campaign2.id)
    end
  end

  describe 'GET /api/v1/campaigns/:id' do
    it 'shows a campaign from current account' do
      get "/api/v1/campaigns/#{campaign1.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_body['campaign']['id']).to eq(campaign1.id)
      expect(json_body['campaign']['name']).to eq('Welcome Series')
    end

    it 'returns 404 for campaign in another account' do
      get "/api/v1/campaigns/#{other_campaign.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
    end
  end
end

