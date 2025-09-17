# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Health', type: :request do
  describe 'GET /api/v1/health' do
    it 'returns ok status payload' do
      get '/api/v1/health'

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include('status' => 'ok')
      expect(response.parsed_body).to have_key('timestamp')
    end
  end

  describe 'GET /health' do
    it 'responds with plain ok status' do
      get '/health'

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include('status' => 'ok')
    end
  end
end
