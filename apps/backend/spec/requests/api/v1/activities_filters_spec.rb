# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Activities filters', type: :request do
  let(:account) { create(:account) }
  let(:user) { create(:user, account:) }

  it 'filters by kind and date range' do
    lead = account.leads.create!(pipeline: create(:pipeline, account:), email: 'a@example.com', status: 'new')
    a1 = account.activities.create!(lead:, kind: 'note', content: 'old', happened_at: 3.days.ago)
    a2 = account.activities.create!(lead:, kind: 'call', content: 'recent', happened_at: 1.day.ago)

    # Filter by kind
    get "/api/v1/leads/#{lead.id}/activities", headers: auth_headers(user), params: { kind: 'call' }
    expect(response).to have_http_status(:ok)
    kinds = json_body['activities'].map { |a| a['kind'] }
    expect(kinds.uniq).to eq(['call'])

    # Filter by happened_after
    get "/api/v1/leads/#{lead.id}/activities", headers: auth_headers(user), params: { happened_after: 2.days.ago.iso8601 }
    expect(response).to have_http_status(:ok)
    ids = json_body['activities'].map { |a| a['id'] }
    expect(ids).to include(a2.id)
    expect(ids).not_to include(a1.id)

    # Filter by happened_before
    get "/api/v1/leads/#{lead.id}/activities", headers: auth_headers(user), params: { happened_before: 2.days.ago.iso8601 }
    expect(response).to have_http_status(:ok)
    ids = json_body['activities'].map { |a| a['id'] }
    expect(ids).to include(a1.id)
    expect(ids).not_to include(a2.id)
  end
end

