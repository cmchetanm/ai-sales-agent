# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Integrations Apollo', type: :request do
  let(:user) { create(:user) }

  it 'persists leads returned by the Apollo client' do
    fake = [
      { first_name: 'Ava', last_name: 'Lee', email: 'ava@example.com', company: 'Example Co', source: 'apollo', external_id: 'id-1' },
      { first_name: 'Ben', last_name: 'Kim', email: nil, company: 'Sample LLC', source: 'apollo', external_id: 'id-2' },
    ]
    allow_any_instance_of(Integrations::ApolloClient).to receive(:search_people).and_return(fake)
    allow_any_instance_of(Integrations::ApolloClient).to receive(:ready?).and_return(true)

    perform_enqueued_jobs do
      ApolloFetchJob.perform_now(account_id: user.account_id, filters: { keywords: 'saas', role: 'cto' })
    end
    emails = user.account.leads.pluck(:email)
    expect(emails).to include('ava@example.com')
    # external_id-only should also be saved
    expect(user.account.leads.where(source: 'apollo').count).to be >= 2
  end
end
