# frozen_string_literal: true

FactoryBot.define do
  factory :integration_connection do
    association :account
    provider { IntegrationConnection::PROVIDERS.sample }
    status { 'inactive' }
    credentials { { 'api_key' => 'secret' } }
    metadata { {} }
  end
end
