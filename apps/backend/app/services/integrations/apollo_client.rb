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
      # Never hit external API during tests unless explicitly allowed
      if defined?(Rails) && Rails.env.test?
        # In test, only allow HTTP when the client is enabled and has an API key
        # (e.g., explicit `enabled: true` in unit tests with WebMock stubs).
        return sample_results(filters) unless (@enabled && @api_key.present? && @conn)
      end
      return sample_results(filters) unless @enabled && @api_key.present? && @conn

      desired = (filters[:limit] || ENV.fetch('APOLLO_RESULT_LIMIT', 25)).to_i
      per_page = [[(ENV.fetch('APOLLO_PER_PAGE', 25)).to_i, desired].min, 100].min
      page = 1
      out = []

      loop do
        payload = payload_for(filters, page: page, per_page: per_page)
        resp = safe_post('mixed_people/search', payload)
        break unless resp && resp[:ok]
        out.concat(map_results(resp[:body]))
        break if out.size >= desired

        # Attempt to continue while results present
        page += 1
        # Stop after 10 pages to be safe
        break if page > 10
      end

      return out.first(desired) if out.any?
      sample_results(filters)
    rescue Faraday::Error => e
      Rails.logger.warn("Apollo search error: #{e.message}")
      sample_results(filters)
    end

    private

    def apollo_enabled?
      # In test, default-off unless explicitly enabled via APOLLO_ENABLED_TEST
      if defined?(Rails) && Rails.env.test?
        return ENV.fetch('APOLLO_ENABLED_TEST', 'false').to_s.casecmp('true').zero?
      end
      # Default-off in non-production to avoid accidental external calls.
      ENV.fetch('APOLLO_ENABLED', Rails.env.production? ? 'true' : 'false').to_s.casecmp('true').zero?
    end

    def payload_for(filters, page: 1, per_page: 5)
      payload = {
        api_key: @api_key,
        q_keywords: filters[:keywords].presence,
        person_titles: filters[:role].present? ? Array(filters[:role]) : nil,
        person_locations: filters[:location].present? ? Array(filters[:location]) : nil,
        page: page,
        per_page: per_page
      }.compact

      # Optional industry/company size hints (best effort; silently ignored by API if not supported)
      if filters[:industry].present?
        payload[:organization_industry_tags] = Array(filters[:industry])
      end
      if filters[:company_size].present?
        payload[:organization_num_employees_ranges] = Array(filters[:company_size])
      end
      payload
    end

    # Post with basic retry on 429/5xx
    def safe_post(path, payload)
      attempts = 0
      while attempts < 3
        attempts += 1
        begin
          resp = @conn.post(path, payload)
          return { ok: true, body: resp.body } if resp.success?
          if resp.status == 429
            sleep(0.25 * attempts)
            next
          end
          Rails.logger.warn("Apollo non-success status=#{resp.status} body=#{resp.body.inspect}")
          return nil
        rescue Faraday::Error => e
          Rails.logger.warn("Apollo error: #{e.class}: #{e.message}")
          sleep(0.25 * attempts)
          next
        end
      end
      nil
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
        industry = p.dig('organization', 'industry') || p.dig('company', 'industry')

        out = { first_name: first_name, last_name: last_name, email: email, company: org_name, job_title: title, linkedin_url: linkedin,
                enrichment: { company_size:, revenue:, industry: }.compact, source: 'apollo' }.compact
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

    public

    def enabled?
      !!@enabled
    end

    def ready?
      enabled? && @api_key.present? && !@conn.nil?
    end
  end
end
