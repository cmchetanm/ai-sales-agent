# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Leads export', type: :request do
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account:) }
  let!(:pipeline) { create(:pipeline, account:) }

  it 'exports CSV with filtered leads' do
    account.leads.create!(pipeline:, email: 'a@example.com', first_name: 'A', last_name: 'One', company: 'Acme', status: 'new')
    account.leads.create!(pipeline:, email: 'b@example.com', first_name: 'B', last_name: 'Two', company: 'Beta', status: 'responded')

    get "/api/v1/leads/export", headers: auth_headers(user), params: { status: 'responded' }

    expect(response).to have_http_status(:ok)
    expect(response.headers['Content-Type']).to include('text/csv')
    expect(response.body).to include('email,first_name,last_name,company')
    expect(response.body).to include('b@example.com')
    expect(response.body).not_to include('a@example.com')
  end
end

