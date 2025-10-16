# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Leads CRUD', type: :request do
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account:) }
  let!(:pipeline) { create(:pipeline, account:) }
  let!(:other_pipeline) { create(:pipeline, account:) }

  it 'creates, updates and destroys a lead' do
    # Create
    post '/api/v1/leads', headers: auth_headers(user), params: { lead: { pipeline_id: pipeline.id, email: 'new@ex.com', first_name: 'New', company: 'Acme' } }.to_json
    expect(response).to have_http_status(:created)
    lead_id = json_body.dig('lead', 'id')

    # Update with pipeline change
    patch "/api/v1/leads/#{lead_id}", headers: auth_headers(user), params: { lead: { pipeline_id: other_pipeline.id, status: 'outreach', company: 'Beta' } }.to_json
    expect(response).to have_http_status(:ok)
    expect(json_body.dig('lead', 'status')).to eq('outreach')
    expect(json_body.dig('lead', 'company')).to eq('Beta')

    # Destroy
    delete "/api/v1/leads/#{lead_id}", headers: auth_headers(user)
    expect(response).to have_http_status(:no_content)
    expect(account.leads.where(id: lead_id)).to be_empty
  end

  it 'converts a lead into contact and optional deal' do
    lead = create(:lead, account: account, pipeline: pipeline, email: 'c@example.com', first_name: 'C', last_name: 'User', company: 'Acme')
    post "/api/v1/leads/#{lead.id}/convert", headers: auth_headers(user), params: { create_deal: true, deal: { name: 'Converted Deal', amount_cents: 5000 } }.to_json
    expect(response).to have_http_status(:ok)
    expect(json_body.dig('contact', 'email')).to eq('c@example.com')
    expect(json_body.dig('deal', 'name')).to eq('Converted Deal')
  end
end
