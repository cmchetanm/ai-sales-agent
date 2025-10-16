# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Companies API', type: :request do
  let(:account) { create(:account) }
  let(:user) { create(:user, account:) }

  it 'creates, lists, shows, updates and deletes companies' do
    post '/api/v1/companies', headers: auth_headers(user), params: { company: { name: 'Acme', domain: 'acme.test' } }.to_json
    expect(response).to have_http_status(:created)
    cid = json_body['company']['id']

    get '/api/v1/companies', headers: auth_headers(user), params: { q: 'acme' }
    expect(response).to have_http_status(:ok)
    expect(json_body['companies'].first['name']).to eq('Acme')

    get "/api/v1/companies/#{cid}", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['company']['domain']).to eq('acme.test')

    patch "/api/v1/companies/#{cid}", headers: auth_headers(user), params: { company: { website: 'https://acme.test' } }.to_json
    expect(response).to have_http_status(:ok)
    expect(json_body['company']['website']).to eq('https://acme.test')

    delete "/api/v1/companies/#{cid}", headers: auth_headers(user)
    expect(response).to have_http_status(:no_content)
  end
end

