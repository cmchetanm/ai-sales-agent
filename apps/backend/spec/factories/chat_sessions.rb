# frozen_string_literal: true

FactoryBot.define do
  factory :chat_session do
    association :account
    association :user
    status { 'active' }
    metadata { {} }

    after(:build) do |session|
      session.user ||= build(:user, account: session.account)
      session.user.account = session.account if session.user
    end
  end
end
