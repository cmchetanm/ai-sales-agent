# frozen_string_literal: true

FactoryBot.define do
  factory :pipeline do
    association :account
    sequence(:name) { |n| "Pipeline #{n}" }
    status { 'active' }
    stage_definitions { [{ 'name' => 'New' }, { 'name' => 'Contacted' }] }
    primary { false }
  end
end
