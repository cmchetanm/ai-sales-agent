# frozen_string_literal: true

FactoryBot.define do
  factory :plan do
    sequence(:name) { |n| "Plan #{n}" }
    sequence(:slug) { |n| "plan-#{n}" }
    monthly_price_cents { 0 }
    limits { { 'leads_per_month' => 100 } }
    features { { 'enabled' => %w[basic_campaigns] } }
    active { true }
  end
end
