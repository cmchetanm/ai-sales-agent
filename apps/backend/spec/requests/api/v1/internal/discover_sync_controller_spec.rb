# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Internal discover (sync)', type: :request do
  let!(:account) { create(:account) }
  let(:token) { 'tok' }

  before do
    allow(ENV).to receive(:fetch).with('INTERNAL_API_TOKEN', nil).and_return(token)
  end

  it 'runs LeadDiscoveryJob synchronously and returns sample' do
    # Stub the job to create a few records
    allow(LeadDiscoveryJob).to receive(:perform_now) do |account_id:, filters:|
      account = Account.find(account_id)
      pipe = account.pipelines.first || account.pipelines.create!(name: 'Default', status: 'active')
      %w[a b c].each_with_index do |name, i|
        account.leads.create!(pipeline: pipe, email: "#{name}@ex.com", first_name: name.upcase, company: 'Acme')
      end
    end

    post '/api/v1/internal/discover_leads',
         headers: { 'X-Internal-Token' => token },
         params: { account_id: account.id, filters: { role: 'cto' }, sync: true }

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body['status']).to eq('ok')
    expect(body['created']).to be >= 1
    expect(body['sample']).to be_an(Array)
  end
end

