# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Leads import', type: :request do
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account:) }
  let!(:pipeline) { create(:pipeline, account:) }

  it 'queues import job and returns accepted' do
    ActiveJob::Base.queue_adapter = :test
    csv = <<~CSV
      email,first_name,last_name,company,status
      a@example.com,A,One,Acme,new
      b@example.com,B,Two,Acme,outreach
    CSV
    post '/api/v1/leads/import', headers: auth_headers(user), params: { csv:, pipeline_id: pipeline.id }.to_json
    expect(response).to have_http_status(:accepted)
    expect(enqueued_jobs.map { |j| j[:job] }).to include(LeadImportJob)
  ensure
    ActiveJob::Base.queue_adapter = :inline
  end
end
