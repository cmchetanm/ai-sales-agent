# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Leads qualify', type: :request do
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account:) }
  let!(:pipeline) { create(:pipeline, account:) }
  let!(:lead) { create(:lead, account:, pipeline:) }

  it 'queues qualification job' do
    ActiveJob::Base.queue_adapter = :test
    post "/api/v1/leads/#{lead.id}/qualify", headers: auth_headers(user)
    expect(response).to have_http_status(:accepted)
    expect(enqueued_jobs.map { |j| j[:job] }).to include(LeadQualificationJob)
  ensure
    ActiveJob::Base.queue_adapter = :inline
  end
end

