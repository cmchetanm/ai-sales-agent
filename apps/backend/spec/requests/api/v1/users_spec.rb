# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Users', type: :request do
  let!(:plan) { create(:plan) }
  let!(:account) { create(:account, plan:) }
  let!(:user) { create(:user, account:) }
  let!(:other_account) { create(:account, plan:) }
  let!(:other_user) { create(:user, account: other_account) }

  it 'lists users for current account only' do
    get '/api/v1/users', headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    emails = json_body['users'].map { |u| u['email'] }
    expect(emails).to include(user.email)
    expect(emails).not_to include(other_user.email)
  end
end

