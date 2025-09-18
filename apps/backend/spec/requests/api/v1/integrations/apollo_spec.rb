# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Integrations Apollo', type: :request do
  let(:user) { create(:user) }

  it 'creates sample leads when job runs' do
    perform_enqueued_jobs do
      ApolloFetchJob.perform_now(account_id: user.account_id, filters: { keywords: 'saas', role: 'cto' })
    end
    expect(user.account.leads.count).to be >= 1
  end
end
