# frozen_string_literal: true

FactoryBot.define do
  factory :campaign do
    association :account
    association :pipeline
    sequence(:name) { |n| "Campaign #{n}" }
    channel { 'email' }
    status { 'draft' }
    audience_filters { {} }
    schedule { {} }
    metrics { {} }

    after(:build) do |campaign|
      campaign.pipeline ||= build(:pipeline, account: campaign.account)
      campaign.pipeline.account = campaign.account if campaign.pipeline
    end
  end
end
