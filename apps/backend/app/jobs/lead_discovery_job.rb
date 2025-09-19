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
      ]
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
    results.uniq { |r| r[:email].to_s.downcase }.each do |attrs|
      next unless attrs[:email].present?
      account.leads.find_or_create_by!(email: attrs[:email]) do |l|
        l.pipeline = account.pipelines.first || account.pipelines.create!(name: 'Default', status: 'active')
        l.first_name = attrs[:first_name]
        l.last_name  = attrs[:last_name]
        l.company    = attrs[:company]
        l.status     = 'new'
        l.source     = attrs[:source].presence || 'aggregator'
      end
    end
  end
end

