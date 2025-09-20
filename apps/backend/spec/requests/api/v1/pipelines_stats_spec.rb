# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Pipelines stats', type: :request do
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account:) }
  let!(:pipeline) { create(:pipeline, account:, stage_definitions: [{ 'name' => 'New' }, { 'name' => 'Outreach' }]) }

  it 'returns stage and status counts' do
    create(:lead, account:, pipeline:, email: 'a@x.com', status: 'new')
    create(:lead, account:, pipeline:, email: 'b@x.com', status: 'outreach')

    get "/api/v1/pipelines/#{pipeline.id}/stats", headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    body = json_body
    expect(body['stage_stats'].find { |s| s['name'] == 'New' }['count']).to eq(1)
    expect(body['status_counts']['outreach']).to eq(1)
  end
end

