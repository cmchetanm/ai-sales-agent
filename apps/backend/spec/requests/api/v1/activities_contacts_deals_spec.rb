# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Activities for contacts and deals', type: :request do
  let(:account) { create(:account) }
  let(:user) { create(:user, account:) }

  it 'creates and lists activities for a contact' do
    contact = account.contacts.create!(first_name: 'Ava', email: 'ava@example.com')
    post "/api/v1/contacts/#{contact.id}/activities", headers: auth_headers(user), params: { activity: { kind: 'note', content: 'hello' } }.to_json
    expect(response).to have_http_status(:created)
    get "/api/v1/contacts/#{contact.id}/activities", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['activities'].first['content']).to eq('hello')
  end

  it 'creates and lists activities for a deal' do
    deal = account.deals.create!(name: 'Opp', amount_cents: 1000, stage: 'qualification')
    post "/api/v1/deals/#{deal.id}/activities", headers: auth_headers(user), params: { activity: { kind: 'note', content: 'ping' } }.to_json
    expect(response).to have_http_status(:created)
    get "/api/v1/deals/#{deal.id}/activities", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['activities'].first['content']).to eq('ping')
  end
end

