# frozen_string_literal: true

class ApolloFetchJob < ApplicationJob
  queue_as :default

  def perform(account_id:, filters: {})
    account = Account.find(account_id)
    results = Integrations::ApolloClient.new.search_people(filters)
    results.each do |lead_attrs|
      account.leads.find_or_create_by!(email: lead_attrs[:email]) do |l|
        l.pipeline = account.pipelines.first || account.pipelines.create!(name: 'Default')
        l.first_name = lead_attrs[:first_name]
        l.last_name  = lead_attrs[:last_name]
        l.company    = lead_attrs[:company]
        l.status     = 'new'
        l.source     = 'apollo'
      end
    end
  end
end

