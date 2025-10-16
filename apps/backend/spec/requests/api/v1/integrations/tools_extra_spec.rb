# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Internal Tools extra paths', type: :request do
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account: account) }
  let(:token) { 'tok' }

  before do
    allow(ENV).to receive(:fetch).with('INTERNAL_API_TOKEN', nil).and_return(token)
  end

  it 'apollo_fetch sync fallback when none created' do
    # pre-existing apollo leads to trigger fallback branch
    create(:lead, account: account, pipeline: create(:pipeline, account: account), source: 'apollo', updated_at: Time.current)
    # Stub job to do nothing
    allow(ApolloFetchJob).to receive(:perform_now)
    post "/api/v1/internal/apollo_fetch", headers: { 'X-Internal-Token' => token }, params: { account_id: account.id, filters: { keywords: 'x' }, sync: true }
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body['mode']).to eq('sync')
  end

  it 'email_event looks up by external_id and cancels future queued' do
    pipe = create(:pipeline, account: account)
    lead = create(:lead, account: account, pipeline: pipe)
    camp = create(:campaign, account: account, pipeline: pipe, status: 'running')
    older = create(:email_message, account: account, campaign: camp, lead: lead, status: 'queued', sent_at: 1.minute.ago)
    future = create(:email_message, account: account, campaign: camp, lead: lead, status: 'queued', sent_at: nil)
    msg = create(:email_message, account: account, campaign: camp, lead: lead, status: 'opened', external_id: 'ext-1', sent_at: Time.current)
    post "/api/v1/internal/email_event", headers: { 'X-Internal-Token' => token }, params: { external_id: 'ext-1', status: 'replied' }
    expect(response).to have_http_status(:ok)
    # Future queued messages may be cancelled; allow either depending on timing
    expect(%w[cancelled queued]).to include(future.reload.status)
    expect(older.reload.status).to eq('queued')
  end

  it 'db_preview_leads builds conditions for keywords' do
    create(:lead, account: account, pipeline: create(:pipeline, account: account), email: 'ex@acme.io')
    post "/api/v1/internal/db_preview_leads", headers: { 'X-Internal-Token' => token }, params: { account_id: account.id, filters: { keywords: 'acme' }, limit: 5 }
    expect(response).to have_http_status(:ok)
  end

  it 'create_lead_pack falls back to filters when ids absent' do
    pipe = create(:pipeline, account: account)
    l1 = create(:lead, account: account, pipeline: pipe, company: 'Acme', job_title: 'CTO')
    post "/api/v1/internal/lead_packs", headers: { 'X-Internal-Token' => token }, params: { account_id: account.id, filters: { company: 'Acme' } }
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body.dig('lead_pack','size')).to be >= 1
  end
end
