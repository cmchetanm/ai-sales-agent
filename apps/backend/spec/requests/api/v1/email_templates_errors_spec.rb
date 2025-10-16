# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 EmailTemplates errors', type: :request do
  let(:user) { create(:user) }

  it 'returns 422 on invalid create' do
    post '/api/v1/email_templates', headers: auth_headers(user), params: { email_template: { name: '' } }.to_json
    expect(response).to have_http_status(:unprocessable_content)
  end

  it 'returns 422 on invalid update' do
    post '/api/v1/email_templates', headers: auth_headers(user), params: { email_template: { name: 'Intro', subject: 'S', body: 'B', format: 'text', category: 'outreach', locale: 'en' } }.to_json
    tid = json_body['email_template']['id']
    patch "/api/v1/email_templates/#{tid}", headers: auth_headers(user), params: { email_template: { name: '' } }.to_json
    expect(response).to have_http_status(:unprocessable_content)
  end
end

