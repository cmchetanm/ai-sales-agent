# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Internal Tools', type: :request do
  let!(:account) { create(:account) }
  let(:token) { 'test-internal' }

  before do
    allow(ENV).to receive(:fetch).with('INTERNAL_API_TOKEN', nil).and_return(token)
  end

  it 'rejects without token' do
    post '/api/v1/internal/profile_update', params: { account_id: account.id, profile: { summary: 'x' } }
    expect(response).to have_http_status(:forbidden)
  end

  it 'updates profile with token' do
    post '/api/v1/internal/profile_update', headers: { 'X-Internal-Token' => token }, params: { account_id: account.id, profile: { summary: 'hello', target_roles: ['cto'] } }
    expect(response).to have_http_status(:ok)
    expect(account.reload.profile.summary).to eq('hello')
  end

  it 'queues apollo fetch with token' do
    ActiveJob::Base.queue_adapter = :test
    post '/api/v1/internal/apollo_fetch', headers: { 'X-Internal-Token' => token }, params: { account_id: account.id, filters: { keywords: 'saas' } }
    expect(response).to have_http_status(:accepted)
    expect(enqueued_jobs.map { |j| j[:job] }).to include(ApolloFetchJob)
  ensure
    ActiveJob::Base.queue_adapter = :inline
  end

  it 'accepts email events to update status and metrics' do
    campaign = create(:campaign, account: account, channel: 'email', status: 'running')
    lead = create(:lead, account: account, pipeline: create(:pipeline, account: account))
    msg = account.email_messages.create!(campaign: campaign, lead: lead, status: 'queued', direction: 'outbound', subject: 'x', body_text: 'y')
    post '/api/v1/internal/email_event', headers: { 'X-Internal-Token' => token }, params: { message_id: msg.id, status: 'replied' }
    expect(response).to have_http_status(:ok)
    expect(msg.reload.status).to eq('replied')
  end
end
