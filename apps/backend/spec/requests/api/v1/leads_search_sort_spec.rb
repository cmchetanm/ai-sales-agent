# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Leads search and sort', type: :request do
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account:) }
  let!(:pipeline) { create(:pipeline, account:) }

  it 'filters by q across fields' do
    l1 = create(:lead, account:, pipeline:, email: 'alpha@example.com', company: 'Acme', first_name: 'Alice', last_name: 'One')
    l2 = create(:lead, account:, pipeline:, email: 'beta@example.com', company: 'Beta', first_name: 'Bob', last_name: 'Two')

    get '/api/v1/leads', headers: auth_headers(user), params: { q: 'acme' }
    expect(response).to have_http_status(:ok)
    emails = json_body['leads'].map { |h| h['email'] }
    expect(emails).to include('alpha@example.com')
    expect(emails).not_to include('beta@example.com')
  end

  it 'falls back to created_at desc when order_by is invalid' do
    older = create(:lead, account:, pipeline:, email: 'old@example.com', created_at: 2.days.ago)
    newer = create(:lead, account:, pipeline:, email: 'new@example.com', created_at: 1.hour.ago)

    get '/api/v1/leads', headers: auth_headers(user), params: { order_by: 'not_a_column' }
    expect(response).to have_http_status(:ok)
    emails = json_body['leads'].map { |h| h['email'] }
    expect(emails.first).to eq('new@example.com')
  end
end

