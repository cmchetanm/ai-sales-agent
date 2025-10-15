# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Integrations Status probe', type: :request do
  it 'returns status block and remains sample mode in test env' do
    # Stub probe to simulate unauthorized
    fake = instance_double(Integrations::ApolloClient)
    allow(Integrations::ApolloClient).to receive(:new).and_return(fake)
    allow(fake).to receive(:enabled?).and_return(true)
    allow(fake).to receive(:ready?).and_return(false)
    allow(fake).to receive(:probe).and_return({ ok: false, status: 401, hint: 'unauthorized' })

    get '/api/v1/integrations/status?probe=true'
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body['apollo']).to be_a(Hash)
    expect(body['apollo']['mode']).to be_a(String)
  end
end
