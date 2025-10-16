# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Integrations Status controller probe', type: :request do
  it 'sets unauthorized mode when probe says 401 (non-test env)' do
    fake = instance_double(Integrations::ApolloClient)
    allow(Integrations::ApolloClient).to receive(:new).and_return(fake)
    allow(fake).to receive(:enabled?).and_return(true)
    allow(fake).to receive(:ready?).and_return(true)
    allow(fake).to receive(:probe).and_return({ ok: false, status: 401, hint: 'unauthorized' })

    allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('development'))

    get '/api/v1/integrations/status?probe=true'
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body.dig('apollo', 'mode')).to eq('unauthorized')
  end
end

