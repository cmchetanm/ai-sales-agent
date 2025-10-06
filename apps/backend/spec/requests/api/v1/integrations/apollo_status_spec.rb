# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Integrations Apollo status', type: :request do
  let(:user) { create(:user) }

  it 'reports sample mode when disabled' do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('APOLLO_API_KEY').and_return(nil)
    get '/api/v1/integrations/health', headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body.dig('apollo', 'ready')).to eq(false)
    expect(body.dig('apollo', 'mode')).to eq('sample')
  end
end
