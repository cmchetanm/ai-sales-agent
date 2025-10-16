# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 ChatSessions index', type: :request do
  let!(:account) { create(:account) }
  let!(:user) { create(:user, account: account) }
  let!(:session1) { create(:chat_session, account: account, user: user) }
  let!(:session2) { create(:chat_session, account: account, user: user) }

  it 'lists sessions' do
    get '/api/v1/chat_sessions', headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    ids = json_body['chat_sessions'].map { |s| s['id'] }
    expect(ids).to include(session1.id, session2.id)
  end
end

