# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Activities', type: :request do
  let!(:user) { create(:user) }
  let!(:lead) { create(:lead, account: user.account) }

  it 'creates and lists activities for a lead' do
    post "/api/v1/leads/#{lead.id}/activities", headers: auth_headers(user), params: { activity: { kind: 'note', content: 'hello' } }.to_json
    expect(response).to have_http_status(:created)

    get "/api/v1/leads/#{lead.id}/activities", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['activities'].first['content']).to eq('hello')
  end
end

