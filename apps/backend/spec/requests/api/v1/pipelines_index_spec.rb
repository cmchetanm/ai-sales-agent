# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Pipelines index listing', type: :request do
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account: account) }

  it 'filters by q and applies default sort for invalid order_by' do
    p1 = create(:pipeline, account: account, name: 'Alpha', status: 'active')
    sleep 0.1
    p2 = create(:pipeline, account: account, name: 'Beta', status: 'archived')
    get '/api/v1/pipelines', headers: auth_headers(user), params: { q: 'beta', order_by: 'invalid', order: 'asc', per_page: 10 }
    expect(response).to have_http_status(:ok)
    names = json_body['pipelines'].map { |x| x['name'] }
    expect(names).to eq(['Beta'])
    expect(json_body['pagination']).to include('page', 'pages', 'count')
  end
end

