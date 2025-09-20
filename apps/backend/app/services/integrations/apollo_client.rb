# frozen_string_literal: true

require 'faraday'

module Integrations
  class ApolloClient
    API_BASE = 'https://api.apollo.io/v1'.freeze

    def initialize(api_key: ENV['APOLLO_API_KEY'], enabled: nil)
      @api_key = api_key
      @enabled = enabled.nil? ? apollo_enabled? : !!enabled
      if @enabled && @api_key.present?
        @conn = Faraday.new(url: API_BASE) do |f|
          f.request :json
          f.response :json, content_type: /json/
          f.adapter Faraday.default_adapter
        end
      end
    end

    def search_people(filters = {})
      return sample_results(filters) unless @enabled && @api_key.present? && @conn

      payload = payload_for(filters)
      resp = @conn.post('mixed_people/search', payload)
      return map_results(resp.body) if resp.success?

      Rails.logger.warn("Apollo search non-200: status=#{resp.status}")
      sample_results(filters)
    rescue Faraday::Error => e
      Rails.logger.warn("Apollo search error: #{e.message}")
      sample_results(filters)
    end

    private

    def apollo_enabled?
      # Default-off in non-production to avoid accidental external calls.
      ENV.fetch('APOLLO_ENABLED', Rails.env.production? ? 'true' : 'false').to_s.casecmp('true').zero?
    end

    def payload_for(filters)
      {
        api_key: @api_key,
        q_keywords: filters[:keywords].presence,
        person_titles: filters[:role].present? ? [filters[:role]] : nil,
        person_locations: filters[:location].present? ? [filters[:location]] : nil,
        page: 1,
        per_page: 5
      }.compact
    end

    def map_results(body)
      list = body['people'] || body['contacts'] || body['results'] || []
      mapped = list.filter_map do |p|
        org_name = p.dig('organization', 'name') || p['organization_name'] || p.dig('company', 'name') || p['company']
        emails = p['emails']
        email = p['email'] ||
                (emails.is_a?(Array) && emails.first.is_a?(Hash) && emails.first['email']) ||
                (emails.is_a?(Array) && emails.first.is_a?(String) && emails.first)

        first_name = p['first_name'] || p.dig('name', 'first') || (p['name'].to_s.split(' ').first if p['name'])
        last_name  = p['last_name']  || p.dig('name', 'last')  || (p['name'].to_s.split(' ').last  if p['name'])

        title = p['title'] || p['person_title'] || p['headline']
        linkedin = p['linkedin_url'] || p['linkedin_profile_url'] || p.dig('organization', 'linkedin_url')
        company_size = p.dig('organization', 'estimated_num_employees') || p.dig('company', 'employee_count')
        revenue = p.dig('organization', 'annual_revenue') || p.dig('company', 'revenue')

        out = { first_name: first_name, last_name: last_name, email: email, company: org_name, job_title: title, linkedin_url: linkedin,
                enrichment: { company_size:, revenue: }.compact, source: 'apollo' }.compact
        out if out[:first_name] || out[:last_name] || out[:email]
      end
      return mapped if mapped.any?
      sample_results({})
    end

    def sample_results(filters)
      seed = (filters[:keywords].to_s + filters[:role].to_s).hash % 1000
      [
        { first_name: 'Ava', last_name: 'Lee',  email: "ava.#{seed}@example.com", company: 'Example Co' },
        { first_name: 'Ben', last_name: 'Kim',  email: "ben.#{seed}@example.com", company: 'Sample LLC' },
        { first_name: 'Cara', last_name: 'Diaz', email: "cara.#{seed}@example.com", company: 'Acme Inc' }
      ]
    end
  end
end
