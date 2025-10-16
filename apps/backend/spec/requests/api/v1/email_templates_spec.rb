# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 EmailTemplates', type: :request do
  let(:user) { create(:user) }

  it 'creates and lists templates' do
    post '/api/v1/email_templates', headers: auth_headers(user), params: { email_template: { name: 'Intro', subject: 'Hi', body: 'Hello {{first_name}}', format: 'html', category: 'outreach', locale: 'en' } }.to_json
    expect(response).to have_http_status(:created)

    get '/api/v1/email_templates', headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_body['email_templates'].first['name']).to eq('Intro')
  end

  it 'filters by category and locale, shows and destroys' do
    post '/api/v1/email_templates', headers: auth_headers(user), params: { email_template: { name: 'Intro', subject: 'Hi', body: 'Hello', format: 'text', category: 'outreach', locale: 'en' } }.to_json
    tid = json_body['email_template']['id']
    get '/api/v1/email_templates', headers: auth_headers(user), params: { category: 'outreach', locale: 'en' }
    expect(response).to have_http_status(:ok)
    get "/api/v1/email_templates/#{tid}", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    delete "/api/v1/email_templates/#{tid}", headers: auth_headers(user)
    expect(response).to have_http_status(:no_content)
  end
end
