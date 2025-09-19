# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LeadDiscoveryJob, type: :job do
  let(:account) { create(:account) }

  it 'persists aggregated leads with dedupe' do
    allow_any_instance_of(Integrations::ApolloClient).to receive(:search_people).and_return([
      { first_name: 'Ava', last_name: 'Lee', email: 'ava@x.com', company: 'X' },
      { first_name: 'Ben', last_name: 'Kim', email: 'ben@x.com', company: 'X' }
    ])
    allow_any_instance_of(Integrations::LinkedinClient).to receive(:search_people).and_return([
      { first_name: 'Ava', last_name: 'Lee', email: 'ava@x.com', company: 'X' }
    ])
    described_class.perform_now(account_id: account.id, filters: { keywords: 'saas' })
    expect(account.leads.where(email: 'ava@x.com')).to exist
    expect(account.leads.where(email: 'ben@x.com')).to exist
  end
end

