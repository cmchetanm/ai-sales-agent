# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Internal Lead Packs actions', type: :request do
  let!(:account) { create(:account) }
  let(:token) { 'tok' }
  let!(:pipeline) { create(:pipeline, account: account) }
  let!(:user) { create(:user, account: account) }

  before do
    allow(ENV).to receive(:fetch).with('INTERNAL_API_TOKEN', nil).and_return(token)
  end

  it 'exports pack CSV and bulk-updates DNC and owner' do
    l1 = create(:lead, account: account, pipeline: pipeline, email: 'a@x.com')
    l2 = create(:lead, account: account, pipeline: pipeline, email: 'b@x.com')
    pack = account.lead_packs.create!(name: 'Pack', lead_ids: [l1.id, l2.id], filters: {})

    # export
    get "/api/v1/internal/lead_packs/#{pack.id}/export", headers: { 'X-Internal-Token' => token }, params: { account_id: account.id, unlocked_only: true }
    expect(response).to have_http_status(:ok)
    expect(response.headers['Content-Type']).to include('text/csv')

    # bulk update
    post "/api/v1/internal/lead_packs/#{pack.id}/bulk_update",
         headers: { 'X-Internal-Token' => token },
         params: { account_id: account.id, lead: { assigned_user_id: user.id, do_not_contact: true } }
    expect(response).to have_http_status(:ok)
    expect(account.leads.where(id: [l1.id, l2.id], assigned_user_id: user.id, do_not_contact: true).count).to eq(2)
  end
end
