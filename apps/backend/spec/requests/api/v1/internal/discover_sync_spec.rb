# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Internal Discover (sync)', type: :request do
  let!(:account) { create(:account) }
  let(:token) { 'test-internal' }

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with('INTERNAL_API_TOKEN', nil).and_return(token)
    allow(ENV).to receive(:fetch).with('APOLLO_ENABLED_TEST', 'false').and_return('false')
  end

  it 'runs discovery synchronously and returns created + sample' do
    # Stub the job to create some rows synchronously
    allow(LeadDiscoveryJob).to receive(:perform_now) do |account_id:, filters:|
      account = Account.find(account_id)
      pipe = account.pipelines.first || account.pipelines.create!(name: 'Default', status: 'active')
      %w[a b].each_with_index do |name, i|
        account.leads.create!(pipeline: pipe, email: "#{name}@discover.test", first_name: name.upcase, company: 'Acme')
      end
    end
    post '/api/v1/internal/discover_leads', headers: { 'X-Internal-Token' => token }, params: { account_id: account.id, filters: { role: 'cto', keywords: 'saas' }, sync: true }
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body['status']).to eq('ok')
    expect(body['mode']).to eq('sync')
    expect(body['created']).to be_a(Integer)
    expect(body['created']).to be >= 1
    expect(body['sample']).to be_an(Array)
  end
end
