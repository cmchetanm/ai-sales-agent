# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Leads convert', type: :request do
  let!(:user) { create(:user) }
  let!(:pipeline) { create(:pipeline, account: user.account) }

  it 'converts a lead into contact and optional deal' do
    # Create a lead with company and email
    post '/api/v1/leads', headers: auth_headers(user), params: {
      lead: { pipeline_id: pipeline.id, email: 'lead@example.com', first_name: 'Ava', last_name: 'Lee', company: 'Acme', status: 'new' }
    }.to_json
    expect(response).to have_http_status(:created)
    lid = json_body['lead']['id']

    # Convert with deal creation
    post "/api/v1/leads/#{lid}/convert", headers: auth_headers(user), params: {
      create_deal: true,
      deal: { name: 'Opp from Lead', amount_cents: 12000, stage: 'qualification' }
    }.to_json
    expect(response).to have_http_status(:ok)
    body = json_body
    expect(body['contact']).to be_present
    expect(body['deal']).to be_present

    # Lead should be archived now
    get "/api/v1/leads/#{lid}", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['lead']['status']).to eq('archived')
  end
end

