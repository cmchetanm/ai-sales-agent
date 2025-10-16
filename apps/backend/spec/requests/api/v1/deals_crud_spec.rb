# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Deals CRUD', type: :request do
  let!(:user) { create(:user) }

  it 'shows, updates and destroys a deal' do
    # Create
    post '/api/v1/deals', headers: auth_headers(user), params: { deal: { name: 'Opp', amount_cents: 5000, stage: 'qualification' } }.to_json
    expect(response).to have_http_status(:created)
    id = json_body['deal']['id']

    # Show
    get "/api/v1/deals/#{id}", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['deal']['name']).to eq('Opp')

    # Update (valid)
    patch "/api/v1/deals/#{id}", headers: auth_headers(user), params: { deal: { stage: 'discovery' } }.to_json
    expect(response).to have_http_status(:ok)
    expect(json_body['deal']['stage']).to eq('discovery')

    # Update (invalid)
    patch "/api/v1/deals/#{id}", headers: auth_headers(user), params: { deal: { stage: 'not_a_stage' } }.to_json
    expect(response).to have_http_status(:unprocessable_content)

    # Destroy
    delete "/api/v1/deals/#{id}", headers: auth_headers(user)
    expect(response).to have_http_status(:no_content)
  end
end

