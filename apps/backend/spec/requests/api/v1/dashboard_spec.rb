# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Dashboard', type: :request do
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account: account) }
  let!(:pipeline) { create(:pipeline, account: account) }

  before do
    # Seed a few leads
    create(:lead, account: account, pipeline: pipeline, email: 'a@ex.com', status: 'new', source: 'apollo', score: 82, locked: false, created_at: 1.week.ago)
    create(:lead, account: account, pipeline: pipeline, email: 'b@ex.com', status: 'outreach', source: 'linkedin', score: 55, locked: true, created_at: 3.days.ago)
    create(:lead, account: account, pipeline: pipeline, email: 'c@ex.com', status: 'responded', source: 'apollo', score: 35, locked: false, created_at: 2.weeks.ago)
  end

  it 'returns aggregated dashboard metrics' do
    get '/api/v1/dashboard', headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body.dig('leads', 'total')).to be >= 3
    expect(body.dig('leads', 'by_status')).to be_a(Hash)
    expect(body.dig('leads', 'by_source')).to be_a(Hash)
    expect(body.dig('leads', 'score_histogram')).to be_a(Hash)
    expect(body.dig('campaigns', 'by_status')).to be_a(Hash)
  end
end

