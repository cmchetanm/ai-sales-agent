# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Account update errors', type: :request do
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account: account) }

  it 'returns 422 when invalid' do
    patch '/api/v1/account', headers: auth_headers(user), params: { account: { name: '' } }.to_json
    expect(response).to have_http_status(:unprocessable_content)
  end
end

