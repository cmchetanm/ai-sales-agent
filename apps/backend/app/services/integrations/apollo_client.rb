# frozen_string_literal: true

require 'faraday'

module Integrations
  class ApolloClient
    API_BASE = 'https://api.apollo.io/api/v1'.freeze

    def initialize(api_key: ENV['APOLLO_API_KEY'], enabled: nil)
      @api_key = api_key.to_s.strip
      @enabled = enabled.nil? ? apollo_enabled? : !!enabled
      if @enabled && @api_key.present?
        @conn = Faraday.new(url: API_BASE) do |f|
          f.request :json
          f.response :json, content_type: /json/
          # Apollo expects API key via x-api-key header for master keys
          f.headers['x-api-key'] = @api_key
          f.headers['Accept'] = 'application/json'
          f.headers['Cache-Control'] = 'no-cache'
          f.adapter Faraday.default_adapter
        end
      end
    end

    def search_people(filters = {})
      # Never hit external API during tests unless explicitly enabled
      if defined?(Rails) && Rails.env.test?
        return [] unless (@enabled && @api_key.present? && @conn)
      end
      return [] unless @enabled && @api_key.present? && @conn

      desired = (filters[:limit] || ENV.fetch('APOLLO_RESULT_LIMIT', 25)).to_i
      per_page = [[(ENV.fetch('APOLLO_PER_PAGE', 25)).to_i, desired].min, 100].min
      page = 1
      out = []

      # Try the current documented search endpoint first, then common fallbacks
      endpoints = ['mixed_people/search', 'contacts/search', 'people/search']
      loop do
        payload = payload_for(filters, page: page, per_page: per_page)
        body = try_endpoints_with_repairs(endpoints, payload)
        break unless body
        out.concat(map_results(body))
        break if out.size >= desired

        # Attempt to continue while results present
        page += 1
        # Stop after 10 pages to be safe
        break if page > 10
      end

      return out.first(desired) if out.any?
      []
    rescue Faraday::Error => e
      Rails.logger.warn("Apollo search error: #{e.message}")
      []
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
        person_locations: normalize_locations(filters[:location]),
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

    def normalize_locations(loc)
      return nil if loc.nil?
      arr = Array(loc).compact.map(&:to_s).map(&:strip).reject(&:blank?)
      return nil if arr.empty?
      arr = arr.map do |v|
        case v.downcase
        when 'us', 'usa', 'u.s.', 'united states', 'united-states'
          'United States'
        when 'uk', 'u.k.', 'united kingdom', 'united-kingdom', 'great britain', 'gb'
          'United Kingdom'
        else
          v
        end
      end
      arr
    end

    # Post with basic retry on 429/5xx
    def safe_post(path, payload)
      attempts = 0
      debug = ENV.fetch('APOLLO_DEBUG', 'false').to_s.casecmp('true').zero?
      while attempts < 3
        attempts += 1
        begin
          resp = @conn.post(path, payload)
          Rails.logger.info("Apollo request #{path} payload=#{payload.merge(api_key: '[REDACTED]').inspect}") if debug
          return { ok: true, status: resp.status, body: resp.body } if resp.success?
          if resp.status == 429
            sleep(0.25 * attempts)
            next
          end
          Rails.logger.warn("Apollo non-success status=#{resp.status} body=#{resp.body.inspect}")
          return { ok: false, status: resp.status, body: resp.body }
        rescue Faraday::Error => e
          Rails.logger.warn("Apollo error: #{e.class}: #{e.message}")
          sleep(0.25 * attempts)
          next
        end
      end
      { ok: false, status: 599, body: { 'error' => 'network_error' } }
    end

    def try_endpoints_with_repairs(endpoints, payload)
      endpoints.each do |path|
        resp = safe_post(path, payload)
        return resp[:body] if resp[:ok]
        next unless resp[:status] == 422

        errs = extract_errors(resp[:body])
        # 1) Remove invalid/unsupported locations
        if payload[:person_locations].present? && errs.any? { |e| e =~ /location|person_locations/i }
          p2 = payload.dup
          p2.delete(:person_locations)
          r2 = safe_post(path, p2)
          return r2[:body] if r2[:ok]
          resp = r2
        end
        # 2) Loosen titles if flagged
        if payload[:person_titles].present? && errs.any? { |e| e =~ /title|person_titles/i }
          p3 = payload.dup
          p3.delete(:person_titles)
          r3 = safe_post(path, p3)
          return r3[:body] if r3[:ok]
          resp = r3
        end
        # 3) Ensure at least some keywords
        if (payload[:q_keywords].to_s.strip.empty?)
          p4 = payload.merge(q_keywords: 'saas')
          r4 = safe_post(path, p4)
          return r4[:body] if r4[:ok]
        end
      end
      nil
    end

    def extract_errors(body)
      return [] unless body
      if body.is_a?(Hash)
        if body['errors'].is_a?(Array)
          return body['errors'].map(&:to_s)
        elsif body['error'].present?
          return [body['error'].to_s]
        end
      end
      [body.to_s]
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
        external_id = p['id'] || p['contact_id'] || p['person_id']
        linkedin = p['linkedin_url'] || p['linkedin_profile_url'] || p.dig('organization', 'linkedin_url')
        company_size = p.dig('organization', 'estimated_num_employees') || p.dig('company', 'employee_count')
        revenue = p.dig('organization', 'annual_revenue') || p.dig('company', 'revenue')
        industry = p.dig('organization', 'industry') || p.dig('company', 'industry')

        locked = email.to_s == 'email_not_unlocked@domain.com'
        out = { first_name: first_name, last_name: last_name, email: email, company: org_name, job_title: title, linkedin_url: linkedin,
                enrichment: { company_size:, revenue:, industry: }.compact, source: 'apollo', external_id: external_id, locked: locked }.compact
        out if out[:first_name] || out[:last_name] || out[:email] || out[:external_id]
      end
      return mapped if mapped.any?
      []
    end

    public

    def enabled?
      !!@enabled
    end

    def ready?
      enabled? && @api_key.present? && !@conn.nil?
    end

    # Lightweight connectivity check. Returns { ok:, status:, hint: }
    def probe
      return { ok: false, status: 0, hint: 'disabled' } unless ready?
      payload = payload_for({ keywords: 'saas', role: 'CTO', location: 'United States' }, page: 1, per_page: 1)
      resp = safe_post('people/search', payload)
      return { ok: true, status: resp[:status], hint: 'ok' } if resp[:ok]
      # Try alternate endpoint and relaxed filters
      relaxed = payload.dup
      relaxed.delete(:person_locations)
      r2 = safe_post('mixed_people/search', relaxed)
      return { ok: true, status: r2[:status], hint: 'ok' } if r2[:ok]
      hint = case r2[:status]
             when 401 then 'unauthorized'
             when 403 then 'forbidden'
             when 422 then 'invalid_payload'
             else 'error'
             end
      { ok: false, status: r2[:status], hint: hint }
    rescue StandardError => e
      { ok: false, status: 0, hint: e.class.name }
    end
  end
end
