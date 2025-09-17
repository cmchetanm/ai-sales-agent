# frozen_string_literal: true

FactoryBot.define do
  factory :lead do
    association :account
    association :pipeline
    sequence(:email) { |n| "lead#{n}@example.com" }
    first_name { Faker::Name.first_name }
    last_name  { Faker::Name.last_name }
    company { Faker::Company.name }
    status { 'new' }
    source { 'internal_db' }
    enrichment { {} }

    after(:build) do |lead|
      lead.pipeline ||= build(:pipeline, account: lead.account)
      lead.pipeline.account = lead.account if lead.pipeline
    end
  end
end
