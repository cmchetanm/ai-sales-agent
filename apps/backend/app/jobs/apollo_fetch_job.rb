# frozen_string_literal: true

class ApolloFetchJob < ApplicationJob
  queue_as :default

  def perform(account_id:, filters: {})
    account = Account.find(account_id)
    results = Integrations::ApolloClient.new.search_people(filters)
    results.each do |attrs|
      next unless attrs[:email].present?
      account.leads.find_or_create_by!(email: attrs[:email]) do |l|
        l.pipeline = account.pipelines.first || account.pipelines.create!(name: 'Default', status: 'active')
        l.first_name = attrs[:first_name]
        l.last_name  = attrs[:last_name]
        l.company    = attrs[:company]
        l.job_title  = attrs[:job_title]
        l.linkedin_url = attrs[:linkedin_url]
        l.status     = 'new'
        l.source     = 'apollo'
        l.enrichment = (l.enrichment || {}).merge(attrs[:enrichment].to_h)
        l.attribution = { vendor: 'apollo', fetched_at: Time.current.iso8601 }
      end
    end
  end
end
