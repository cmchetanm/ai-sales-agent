# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Internal Ping', type: :request do
  it 'accepts dev default token when INTERNAL_API_TOKEN is unset' do
    # Ensure we do not stub ENV here; rely on controller fallback in non-production
    post '/api/v1/internal/ping', headers: { 'X-Internal-Token' => 'dev-internal-token' }
    expect(response).to have_http_status(:ok)
  end

  it 'accepts dev token even if ENV token is set (non-production convenience)' do
    allow(ENV).to receive(:fetch).with('INTERNAL_API_TOKEN', nil).and_return('real-token')
    post '/api/v1/internal/ping', headers: { 'X-Internal-Token' => 'dev-internal-token' }
    expect(response).to have_http_status(:ok)
  end
end
