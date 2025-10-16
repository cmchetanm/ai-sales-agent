# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Users search', type: :request do
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account: account, email: 'match@example.com') }
  let!(:other) { create(:user, account: account, email: 'other@example.com') }

  it 'filters by q param' do
    get '/api/v1/users', headers: auth_headers(user), params: { q: 'match' }
    expect(response).to have_http_status(:ok)
    emails = json_body['users'].map { |u| u['email'] }
    expect(emails).to include('match@example.com')
    expect(emails).not_to include('other@example.com')
  end
end

