# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Users index', type: :request do
  let!(:user) { create(:user) }

  it 'lists users' do
    get '/api/v1/users', headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['users']).to be_a(Array)
    emails = json_body['users'].map { |u| u['email'] }
    expect(emails).to include(user.email)
  end
end

