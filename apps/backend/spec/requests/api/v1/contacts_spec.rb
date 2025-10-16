# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Contacts', type: :request do
  let!(:user) { create(:user) }

  it 'creates and lists contacts' do
    post '/api/v1/contacts', headers: auth_headers(user), params: { contact: { first_name: 'Ava', last_name: 'Lee', email: 'ava@example.com' } }.to_json
    expect(response).to have_http_status(:created)
    get '/api/v1/contacts', headers: auth_headers(user), params: { q: 'ava' }
    expect(response).to have_http_status(:ok)
    expect(json_body['contacts'].first['email']).to eq('ava@example.com')
  end
end

