# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Internal Tools (sync paths)', type: :request do
  let!(:account) { create(:account) }
  let(:token) { 'test-internal' }

  before do
    allow(ENV).to receive(:fetch).with('INTERNAL_API_TOKEN', nil).and_return(token)
  end

  it 'runs apollo_fetch in sync mode and persists results (including external_id-only)' do
    create(:pipeline, account: account)
    # Stub Apollo client to return a mix of email and external_id-only
    fake_results = [
      { first_name: 'Ava', last_name: 'Lee', email: 'ava@example.com', company: 'Example Co', source: 'apollo', external_id: 'abc-1' },
      { first_name: 'No', last_name: 'Email', email: nil, company: 'Locked Co', source: 'apollo', external_id: 'lock-2' }
    ]
    client_double = instance_double(Integrations::ApolloClient, search_people: fake_results)
    allow(Integrations::ApolloClient).to receive(:new).and_return(client_double)

    post '/api/v1/internal/apollo_fetch',
         headers: { 'X-Internal-Token' => token },
         params: { account_id: account.id, filters: { keywords: 'saas', role: 'cto' }, sync: true }

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body['status']).to eq('ok')
    # At least the email and the external_id-only lead should be persisted
    expect(account.leads.where(source: 'apollo').count).to be >= 2
  end

  it 'previews DB with filters role and location together' do
    pipe = create(:pipeline, account: account)
    create(:lead, account: account, pipeline: pipe, email: 'x@example.com', job_title: 'CTO', location: 'United States', company: 'Acme')
    create(:lead, account: account, pipeline: pipe, email: 'y@example.com', job_title: 'VP Marketing', location: 'India', company: 'Beta')

    post '/api/v1/internal/db_preview_leads',
         headers: { 'X-Internal-Token' => token },
         params: { account_id: account.id, filters: { role: 'cto', location: 'united states' }, limit: 5 }

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body['total']).to eq(1)
    expect(body['results'].first['company']).to eq('Acme')
  end

  it 'processes bounced email_event and marks do_not_contact' do
    pipe = create(:pipeline, account: account)
    lead = create(:lead, account: account, pipeline: pipe)
    campaign = create(:campaign, account: account, pipeline: pipe, channel: 'email', status: 'running')
    # Future queued message should be cancelled on bounce
    msg = account.email_messages.create!(campaign: campaign, lead: lead, status: 'queued', direction: 'outbound', subject: 'x', body_text: 'y', sent_at: Time.current + 1.hour)

    post '/api/v1/internal/email_event',
         headers: { 'X-Internal-Token' => token },
         params: { message_id: msg.id, status: 'bounced' }

    expect(response).to have_http_status(:ok)
    expect(lead.reload.do_not_contact).to eq(true)
    expect(msg.reload.status).to eq('cancelled').or eq('bounced')
  end
end
