# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Account', type: :request do
  let!(:user) { create(:user) }

  it 'shows and updates account' do
    get '/api/v1/account', headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['account']['id']).to eq(user.account_id)

    patch '/api/v1/account', headers: auth_headers(user), params: { account: { name: 'New Name' } }.to_json
    expect(response).to have_http_status(:ok)
    expect(json_body['account']['name']).to eq('New Name')
  end
end

