# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Emailing API Health', type: :request do
  describe 'GET /api/v1/health' do
    it 'responds with ok payload' do
      get '/api/v1/health'

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include('status' => 'ok')
    end
  end
end
