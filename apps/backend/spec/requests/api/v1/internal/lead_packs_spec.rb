# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Internal Lead Packs', type: :request do
  let!(:account) { create(:account) }
  let(:token) { 'tok' }
  let!(:pipeline) { create(:pipeline, account: account) }

  before do
    allow(ENV).to receive(:fetch).with('INTERNAL_API_TOKEN', nil).and_return(token)
  end

  it 'creates a lead pack from lead_ids' do
    l1 = create(:lead, account: account, pipeline: pipeline, email: 'a@ex.com')
    l2 = create(:lead, account: account, pipeline: pipeline, email: 'b@ex.com')
    post '/api/v1/internal/lead_packs', headers: { 'X-Internal-Token' => token }, params: { account_id: account.id, name: 'Pack', lead_ids: [l1.id, l2.id] }
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body.dig('lead_pack', 'size')).to eq(2)
  end
end

