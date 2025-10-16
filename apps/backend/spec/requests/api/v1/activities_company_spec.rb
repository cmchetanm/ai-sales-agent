# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Activities for companies', type: :request do
  let(:account) { create(:account) }
  let(:user) { create(:user, account:) }

  it 'aggregates activities from contacts and deals under a company' do
    company = account.companies.create!(name: 'Umbrella', domain: 'umbrella.test')
    contact = account.contacts.create!(first_name: 'Jill', email: 'jill@umbrella.test', company:)
    deal = account.deals.create!(name: 'SaaS Renewal', amount_cents: 50000, stage: 'qualification', company:)
    account.activities.create!(contact:, kind: 'note', content: 'Spoke with contact', happened_at: Time.current)
    account.activities.create!(deal:, kind: 'call', content: 'Demo scheduled', happened_at: Time.current)

    get "/api/v1/companies/#{company.id}/activities", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    kinds = json_body['activities'].map { |a| a['kind'] }
    expect(kinds).to include('note')
    expect(kinds).to include('call')
  end
end

