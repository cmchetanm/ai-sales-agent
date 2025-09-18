# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Integrations Apollo', type: :request do
  let(:user) { create(:user) }

  it 'queues a fetch job and accepts request' do
    expect do
      post '/api/v1/integrations/apollo', headers: auth_headers(user), params: { filters: { keywords: 'saas', role: 'cto' } }
    end.to have_enqueued_job(ApolloFetchJob)

    expect(response).to have_http_status(:accepted)
  end

  it 'creates sample leads when job runs' do
    perform_enqueued_jobs do
      ApolloFetchJob.perform_now(account_id: user.account_id, filters: { keywords: 'saas', role: 'cto' })
    end
    expect(user.account.leads.count).to be >= 1
  end
end

