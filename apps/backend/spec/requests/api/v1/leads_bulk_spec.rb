# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Leads bulk', type: :request do
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account:) }
  let!(:pipeline) { create(:pipeline, account:) }
  let!(:other_pipeline) { create(:pipeline, account:) }
  let!(:leads) { create_list(:lead, 3, account:, pipeline:) }

  it 'bulk updates status and pipeline' do
    patch '/api/v1/leads/bulk_update',
          headers: auth_headers(user),
          params: { ids: leads.map(&:id), lead: { status: 'outreach', pipeline_id: other_pipeline.id } }.to_json
    expect(response).to have_http_status(:ok)
    expect(json_body['updated']).to eq(3)
    expect(account.leads.where(status: 'outreach', pipeline: other_pipeline).count).to eq(3)
  end
end
