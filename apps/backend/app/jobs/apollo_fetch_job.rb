# frozen_string_literal: true

class ApolloFetchJob < ApplicationJob
  queue_as :default

  def perform(account_id:, filters: {})
    account = Account.find(account_id)
    results = Integrations::ApolloClient.new.search_people(filters)
    require 'set'
    seen = Set.new
    Array(results).each do |attrs|
      email = attrs[:email].to_s.downcase.presence
      external_id = attrs[:external_id].to_s.presence
      dedup = email || (external_id && "apollo:#{external_id}")
      next unless dedup
      next if seen.include?(dedup)
      seen.add(dedup)

      lead = if email
               account.leads.find_or_initialize_by(email: email)
             else
               account.leads.find_or_initialize_by(external_id: external_id, source: 'apollo')
             end
      if lead.new_record?
        lead.pipeline = account.pipelines.first || account.pipelines.create!(name: 'Default', status: 'active')
        lead.status = 'new'
      end
      lead.first_name = attrs[:first_name]
      lead.last_name  = attrs[:last_name]
      lead.company    = attrs[:company]
      lead.job_title  = attrs[:job_title]
      lead.linkedin_url = attrs[:linkedin_url]
      lead.source     = 'apollo'
      lead.enrichment = (lead.enrichment || {}).merge(attrs[:enrichment].to_h)
      lead.attribution = { vendor: 'apollo', fetched_at: Time.current.iso8601 }
      lead.save!
    end
  end
end
