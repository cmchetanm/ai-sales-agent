# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Deals', type: :request do
  let!(:user) { create(:user) }

  it 'creates and lists deals' do
    post '/api/v1/deals', headers: auth_headers(user), params: { deal: { name: 'New Opp', amount_cents: 10000, stage: 'qualification' } }.to_json
    expect(response).to have_http_status(:created)
    get '/api/v1/deals', headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['deals'].first['name']).to eq('New Opp')
  end
end

