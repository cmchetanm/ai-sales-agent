# frozen_string_literal: true

FactoryBot.define do
  factory :email_message do
    association :account
    association :campaign
    association :lead
    direction { 'outbound' }
    status { 'pending' }
    subject { 'Hello' }
    body_text { 'Test' }
    sent_at { Time.current }
    metadata { {} }

    after(:build) do |message|
      message.campaign ||= build(:campaign, account: message.account)
      pipeline = message.campaign&.pipeline || build(:pipeline, account: message.account)
      pipeline.account = message.account
      message.campaign.pipeline = pipeline if message.campaign
      message.lead ||= build(:lead, account: message.account, pipeline: pipeline)
      message.campaign.account = message.account if message.campaign
      message.lead.account = message.account if message.lead
      message.lead.pipeline = pipeline
    end
  end
end
