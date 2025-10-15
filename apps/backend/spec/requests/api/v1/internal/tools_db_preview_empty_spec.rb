# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Internal db_preview empty filters', type: :request do
  let!(:account) { create(:account) }
  let(:token) { 'tok' }

  before do
    allow(ENV).to receive(:fetch).with('INTERNAL_API_TOKEN', nil).and_return(token)
  end

  it 'returns ok with role filter that yields no results' do
    post '/api/v1/internal/db_preview_leads', headers: { 'X-Internal-Token' => token }, params: { account_id: account.id, filters: { role: 'nonexistent' }, limit: 5 }
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body['total']).to eq(0)
    expect(body['results']).to eq([])
  end
end
