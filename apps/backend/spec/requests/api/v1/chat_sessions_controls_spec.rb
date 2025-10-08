# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 ChatSessions controls', type: :request do
  let(:user) { create(:user) }

  it 'pauses, resumes and completes a session' do
    post '/api/v1/chat_sessions', headers: auth_headers(user)
    id = JSON.parse(response.body).dig('chat_session', 'id')

    post "/api/v1/chat_sessions/#{id}/pause", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).dig('chat_session', 'status')).to eq('paused')

    post "/api/v1/chat_sessions/#{id}/resume", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).dig('chat_session', 'status')).to eq('active')

    post "/api/v1/chat_sessions/#{id}/complete", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).dig('chat_session', 'status')).to eq('completed')
  end
end

