# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Leads search', type: :request do
  let(:user) { create(:user) }

  it 'filters by q across basic fields' do
    p1 = create(:pipeline, account: user.account)
    create(:lead, account: user.account, pipeline: p1, email: 'alice@acme.io', company: 'Acme Inc', first_name: 'Alice', last_name: 'A')
    create(:lead, account: user.account, pipeline: p1, email: 'bob@example.com', company: 'Beta LLC', first_name: 'Bob', last_name: 'B')

    get '/api/v1/leads', params: { q: 'acme' }, headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    emails = response.parsed_body.fetch('leads').map { |l| l['email'] }
    expect(emails).to include('alice@acme.io')
    expect(emails).not_to include('bob@example.com')
  end
end

