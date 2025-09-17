# frozen_string_literal: true

FactoryBot.define do
  factory :chat_message do
    association :chat_session
    sender_type { 'user' }
    sender_id { chat_session.user_id }
    content { 'Hello there' }
    metadata { {} }
    sent_at { Time.current }

    after(:build) do |message|
      message.chat_session ||= build(:chat_session)
      message.sender_id ||= message.chat_session.user_id
    end
  end
end
