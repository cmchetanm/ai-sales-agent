# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Contacts CRUD', type: :request do
  let!(:user) { create(:user) }

  it 'shows, updates and destroys a contact' do
    # Create
    post '/api/v1/contacts', headers: auth_headers(user), params: { contact: { first_name: 'Ava', last_name: 'Lee', email: 'ava2@example.com' } }.to_json
    expect(response).to have_http_status(:created)
    id = json_body['contact']['id']

    # Show
    get "/api/v1/contacts/#{id}", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['contact']['email']).to eq('ava2@example.com')

    # Update
    patch "/api/v1/contacts/#{id}", headers: auth_headers(user), params: { contact: { phone: '123456' } }.to_json
    expect(response).to have_http_status(:ok)
    expect(json_body['contact']['phone']).to eq('123456')

    # Destroy
    delete "/api/v1/contacts/#{id}", headers: auth_headers(user)
    expect(response).to have_http_status(:no_content)
  end
end

