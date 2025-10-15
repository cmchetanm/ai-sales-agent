# frozen_string_literal: true

class LeadDiscoveryJob < ApplicationJob
  queue_as :default

  # filters: { keywords:, role:, location: }
  def perform(account_id:, filters: {})
    account = Account.find(account_id)

    existing = db_search(account, filters)
    results = existing.dup

    if results.size < desired_minimum
      vendors = [
        Integrations::ApolloClient.new,
        Integrations::LinkedinClient.new,
        Integrations::HubspotClient.new,
        Integrations::SalesforceClient.new
      ].select { |c| c.respond_to?(:ready?) ? c.ready? : true }
      vendors.each do |client|
        begin
          vendor_results = client.search_people(filters)
          results.concat(Array(vendor_results))
        rescue StandardError => e
          Rails.logger.warn("LeadDiscovery vendor error #{client.class.name}: #{e.message}")
        end
      end
    end

    persist_leads(account, results)
  end

  private

  def desired_minimum
    10
  end

  def db_search(account, filters)
    q = filters[:keywords].to_s.downcase
    role = filters[:role].to_s.downcase
    location = filters[:location].to_s.downcase
    scope = account.leads
    conditions = []
    params = {}
    unless q.blank?
      conditions << '(LOWER(email) LIKE :q OR LOWER(company) LIKE :q OR LOWER(first_name) LIKE :q OR LOWER(last_name) LIKE :q)'
      params[:q] = "%#{q}%"
    end
    unless role.blank?
      conditions << 'LOWER(job_title) LIKE :role'
      params[:role] = "%#{role}%"
    end
    unless location.blank?
      conditions << 'LOWER(location) LIKE :loc'
      params[:loc] = "%#{location}%"
    end
    return [] if conditions.empty?
    scope.where(conditions.join(' AND '), params).limit(desired_minimum).map do |l|
      { first_name: l.first_name, last_name: l.last_name, email: l.email, company: l.company }
    end
  end

  def persist_leads(account, results)
    require 'set'
    seen = Set.new
    Array(results).each do |attrs|
      email = attrs[:email].to_s.downcase.presence
      source = attrs[:source].to_s.presence
      external_id = attrs[:external_id].to_s.presence
      dedup_key = email || (source && external_id && "#{source}:#{external_id}")
      next unless dedup_key
      next if seen.include?(dedup_key)
      seen.add(dedup_key)

      lead = if email
               account.leads.find_or_initialize_by(email: email)
             else
               account.leads.find_or_initialize_by(external_id: external_id, source: source)
             end

      if lead.new_record?
        lead.pipeline = account.pipelines.first || account.pipelines.create!(name: 'Default', status: 'active')
        lead.status = 'new'
      end
      lead.first_name = attrs[:first_name] if attrs.key?(:first_name)
      lead.last_name  = attrs[:last_name]  if attrs.key?(:last_name)
      lead.company    = attrs[:company]    if attrs.key?(:company)
      lead.job_title  = attrs[:job_title]  if attrs.key?(:job_title)
      lead.linkedin_url = attrs[:linkedin_url] if attrs.key?(:linkedin_url)
      lead.source     = source if source.present?
      lead.enrichment = (lead.enrichment || {}).merge(attrs[:enrichment].to_h)
      lead.attribution = { vendor: (lead.source.presence || 'aggregator'), fetched_at: Time.current.iso8601 }
      lead.save!
    end
  end
end
