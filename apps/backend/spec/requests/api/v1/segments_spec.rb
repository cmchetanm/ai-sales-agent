# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Segments', type: :request do
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account: account) }

  it 'creates, lists, shows and deletes a segment' do
    # create
    post '/api/v1/segments', headers: auth_headers(user), params: { segment: { name: 'CTOs', filters: { role: 'cto' } } }.to_json
    expect(response).to have_http_status(:created)
    id = json_body.dig('segment', 'id')

    # index
    get '/api/v1/segments', headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['segments'].map { |s| s['id'] }).to include(id)

    # show
    get "/api/v1/segments/#{id}", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body.dig('segment', 'name')).to eq('CTOs')

    # destroy
    delete "/api/v1/segments/#{id}", headers: auth_headers(user)
    expect(response).to have_http_status(:no_content)
  end
end

