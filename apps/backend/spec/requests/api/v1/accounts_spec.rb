# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Account', type: :request do
  let!(:plan) { create(:plan) }
  let!(:account) { create(:account, plan:, name: 'Acme') }
  let!(:user) { create(:user, account:) }

  it 'shows account' do
    get '/api/v1/account', headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['account']['name']).to eq('Acme')
  end

  it 'updates account name' do
    patch '/api/v1/account', headers: auth_headers(user), params: { account: { name: 'New Name' } }.to_json
    expect(response).to have_http_status(:ok)
    expect(json_body['account']['name']).to eq('New Name')
  end
end
