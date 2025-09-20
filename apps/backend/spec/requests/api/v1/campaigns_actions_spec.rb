# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Campaign actions', type: :request do
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account:) }
  let!(:pipeline) { create(:pipeline, account:) }
  let!(:campaign) { create(:campaign, account:, pipeline:, channel: 'email', status: 'draft') }
  let!(:lead) { create(:lead, account:, pipeline:, email: 't@example.com', status: 'new') }

  it 'previews audience size' do
    get "/api/v1/campaigns/#{campaign.id}/preview", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['target_count']).to be >= 1
  end

  it 'starts a campaign and enqueues run job' do
    ActiveJob::Base.queue_adapter = :test
    post "/api/v1/campaigns/#{campaign.id}/start", headers: auth_headers(user)
    expect(response).to have_http_status(:accepted)
    expect(enqueued_jobs.map { |j| j[:job] }).to include(CampaignRunJob)
  ensure
    ActiveJob::Base.queue_adapter = :inline
  end

  it 'pauses a campaign' do
    campaign.update!(status: 'running')
    post "/api/v1/campaigns/#{campaign.id}/pause", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['campaign']['status']).to eq('paused')
  end
end

