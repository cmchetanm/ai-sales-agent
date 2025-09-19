# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Integrations Discover', type: :request do
  let(:account) { create(:account) }
  let(:token) { 'test-internal' }

  before do
    allow(ENV).to receive(:fetch).with('INTERNAL_API_TOKEN', nil).and_return(token)
  end

  it 'queues lead discovery job' do
    ActiveJob::Base.queue_adapter = :test
    post '/api/v1/internal/discover_leads', headers: { 'X-Internal-Token' => token }, params: { account_id: account.id, filters: { keywords: 'saas' } }
    expect(response).to have_http_status(:accepted)
    expect(enqueued_jobs.map { |j| j[:job] }).to include(LeadDiscoveryJob)
  ensure
    ActiveJob::Base.queue_adapter = :inline
  end
end
