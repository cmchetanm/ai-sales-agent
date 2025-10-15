# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Leads filters', type: :request do
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account:) }
  let!(:pipeline) { create(:pipeline, account:) }

  it 'filters by do_not_contact and updated_before/after' do
    a = create(:lead, account:, pipeline:, email: 'a@ex.com', do_not_contact: true, updated_at: 3.days.ago)
    b = create(:lead, account:, pipeline:, email: 'b@ex.com', do_not_contact: false, updated_at: 1.hour.ago)

    # DNC filter
    get '/api/v1/leads', headers: auth_headers(user), params: { do_not_contact: true }
    expect(response).to have_http_status(:ok)
    emails = json_body['leads'].map { |h| h['email'] }
    expect(emails).to include('a@ex.com')
    expect(emails).not_to include('b@ex.com')

    # updated_after should include b
    get '/api/v1/leads', headers: auth_headers(user), params: { updated_after: 2.hours.ago.iso8601 }
    expect(response).to have_http_status(:ok)
    emails = json_body['leads'].map { |h| h['email'] }
    expect(emails).to include('b@ex.com')
    expect(emails).not_to include('a@ex.com')

    # invalid updated_before must not 500 and likely returns both
    get '/api/v1/leads', headers: auth_headers(user), params: { updated_before: 'not-a-time' }
    expect(response).to have_http_status(:ok)
  end

  it 'filters locked vs unlocked and sorts by score' do
    locked = create(:lead, account: account, pipeline: pipeline, email: 'l@ex.com', locked: true, score: 10)
    unlocked = create(:lead, account: account, pipeline: pipeline, email: 'u@ex.com', locked: false, score: 80)

    get '/api/v1/leads', headers: auth_headers(user), params: { locked: true }
    expect(response).to have_http_status(:ok)
    emails = json_body['leads'].map { |h| h['email'] }
    expect(emails).to include('l@ex.com')
    expect(emails).not_to include('u@ex.com')

    get '/api/v1/leads', headers: auth_headers(user), params: { order_by: 'score', order: 'desc' }
    expect(response).to have_http_status(:ok)
    emails = json_body['leads'].map { |h| h['email'] }
    expect(emails.first).to eq('u@ex.com')
  end

  it 'sorts by allowed column when requested' do
    x = create(:lead, account:, pipeline:, email: 'x@ex.com', company: 'Zeta')
    y = create(:lead, account:, pipeline:, email: 'y@ex.com', company: 'Alpha')
    get '/api/v1/leads', headers: auth_headers(user), params: { order_by: 'company', order: 'asc' }
    expect(response).to have_http_status(:ok)
    emails = json_body['leads'].map { |h| h['email'] }
    expect(emails.first).to eq('y@ex.com')
  end
end
