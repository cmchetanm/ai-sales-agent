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

  it 'responds to ping with token' do
    post '/api/v1/internal/ping', headers: { 'X-Internal-Token' => token }
    expect(response).to have_http_status(:ok)
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

  it 'previews db leads with token' do
    lead = create(:lead, account: account, pipeline: create(:pipeline, account: account), email: 'db@example.com', company: 'DB Co', first_name: 'Db', last_name: 'Lead', job_title: 'CTO')
    post '/api/v1/internal/db_preview_leads', headers: { 'X-Internal-Token' => token }, params: { account_id: account.id, filters: { role: 'cto' }, limit: 3 }
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body['total']).to be >= 1
    expect(body['results']).to be_an(Array)
  end

  it 'closes chat session with token' do
    session = account.chat_sessions.create!(status: 'active')
    post '/api/v1/internal/close_chat', headers: { 'X-Internal-Token' => token }, params: { account_id: account.id, chat_session_id: session.id }
    expect(response).to have_http_status(:ok)
    expect(session.reload.status).to eq('completed')
  end
end
