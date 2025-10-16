# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Pipelines errors', type: :request do
  let!(:plan) { create(:plan) }
  let!(:account) { create(:account, plan:) }
  let!(:user) { create(:user, account:) }

  it 'returns 422 on invalid create' do
    post '/api/v1/pipelines', headers: auth_headers(user), params: { pipeline: { name: '', status: 'invalid' } }.to_json
    expect(response).to have_http_status(:unprocessable_content)
  end

  it 'returns 422 on invalid update' do
    p = create(:pipeline, account: account, status: 'active')
    patch "/api/v1/pipelines/#{p.id}", headers: auth_headers(user), params: { pipeline: { status: 'bogus' } }.to_json
    expect(response).to have_http_status(:unprocessable_content)
  end
end

