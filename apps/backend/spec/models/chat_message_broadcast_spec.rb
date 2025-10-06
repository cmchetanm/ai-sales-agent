# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ChatMessage, type: :model do
  include ActionCable::TestHelper

  it 'broadcasts to the session stream after create' do
    account = create(:account)
    session = account.chat_sessions.create!(status: 'active')
    expect do
      session.chat_messages.create!(sender_type: 'Assistant', content: 'hello', sent_at: Time.current)
    end.to have_broadcasted_to("chat_session:#{session.id}").with(hash_including(event: 'message.created', message: hash_including(content: 'hello')))
  end
end

