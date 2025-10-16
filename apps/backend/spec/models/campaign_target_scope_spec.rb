# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Campaign, type: :model do
  it 'computes target_scope with filters' do
    account = create(:account)
    pipe = create(:pipeline, account: account)
    lead1 = create(:lead, account: account, pipeline: pipe, email: 'a@co.com', company: 'Acme', job_title: 'CTO', location: 'US', enrichment: { industry: 'SaaS' }, locked: false)
    lead2 = create(:lead, account: account, pipeline: pipe, email: 'b@co.com', company: 'Beta', job_title: 'VP Eng', location: 'UK', enrichment: { industry: 'Healthcare' }, locked: true)
    camp = described_class.create!(account: account, pipeline: pipe, name: 'C', channel: 'email', status: 'draft', audience_filters: { 'status' => 'new', 'industries' => ['SaaS'], 'roles' => ['CTO'], 'locations' => ['US'], 'q' => 'acme' })
    scope = camp.target_scope
    expect(scope).to include(lead1)
    expect(scope).not_to include(lead2)
  end

  it 'sequence returns array for missing column' do
    c = described_class.new
    expect(c.sequence).to eq([])
  end
end

