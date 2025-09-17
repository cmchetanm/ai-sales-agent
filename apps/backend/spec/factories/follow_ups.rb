# frozen_string_literal: true

FactoryBot.define do
  factory :follow_up do
    association :account
    association :lead
    channel { 'email' }
    status { 'scheduled' }
    execute_at { 1.day.from_now }
    payload { {} }

    after(:build) do |follow_up|
      follow_up.lead ||= build(:lead, account: follow_up.account)
      follow_up.campaign ||= build(:campaign, account: follow_up.account, pipeline: follow_up.lead.pipeline)
      follow_up.lead.account = follow_up.account if follow_up.lead
      follow_up.campaign&.account = follow_up.account
    end
  end
end
