# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Integrations::ApolloClient do
  describe '#enabled?/ready?' do
    it 'is disabled by default in test' do
      client = described_class.new(api_key: nil)
      expect(client.enabled?).to eq(false)
      expect(client.ready?).to eq(false)
    end

    it 'is ready when explicitly enabled with key' do
      client = described_class.new(api_key: 'key', enabled: true)
      expect(client.enabled?).to eq(true)
      expect(client.ready?).to eq(true)
    end
  end

  describe 'private helpers' do
    let(:client) { described_class.new(api_key: 'k', enabled: true) }

    it 'normalizes locations' do
      expect(client.send(:normalize_locations, ['us','UK','Berlin'])).to eq(['United States', 'United Kingdom', 'Berlin'])
      expect(client.send(:normalize_locations, nil)).to be_nil
      expect(client.send(:normalize_locations, [])).to be_nil
    end

    it 'builds payload with optional hints' do
      p = client.send(:payload_for, { keywords: 'saas', role: 'CTO', location: 'US', industry: 'SaaS', company_size: '1-50' }, page: 2, per_page: 3)
      expect(p[:q_keywords]).to eq('saas')
      expect(p[:person_titles]).to eq(['CTO'])
      expect(p[:person_locations]).to include('United States')
      expect(p[:organization_industry_tags]).to include('SaaS')
      expect(p[:organization_num_employees_ranges]).to include('1-50')
      expect(p[:page]).to eq(2)
      expect(p[:per_page]).to eq(3)
    end

    it 'extracts errors from body' do
      expect(client.send(:extract_errors, { 'errors' => ['bad'] })).to eq(['bad'])
      expect(client.send(:extract_errors, { 'error' => 'bad' })).to eq(['bad'])
      expect(client.send(:extract_errors, nil)).to eq([])
    end

    it 'maps results into unified shape' do
      body = { 'people' => [
        { 'first_name' => 'A', 'last_name' => 'B', 'email' => 'a@b.com', 'organization' => { 'name' => 'Acme', 'industry' => 'SaaS' }, 'id' => 'x1', 'title' => 'CTO' },
        { 'first_name' => 'Jane', 'last_name' => 'Doe', 'emails' => [{ 'email' => 'j@d.co' }], 'company' => { 'name' => 'Co' }, 'person_id' => 'y2' }
      ] }
      out = client.send(:map_results, body)
      expect(out.size).to eq(2)
      expect(out.first[:company]).to eq('Acme')
      expect(out.first[:source]).to eq('apollo')
      expect(out.first[:external_id]).to eq('x1')
    end

    it 'safe_post handles success, 429 retry and Faraday error' do
      client = described_class.new(api_key: 'k', enabled: true)
      conn = instance_double(Faraday::Connection)
      client.instance_variable_set(:@conn, conn)
      # success
      allow(conn).to receive(:post).and_return(double(success?: true, status: 200, body: { 'ok' => true }))
      ok = client.send(:safe_post, 'path', {})
      expect(ok[:ok]).to eq(true)
      # 429 then non-success
      calls = 0
      allow(conn).to receive(:post) do
        calls += 1
        if calls == 1
          double(success?: false, status: 429, body: {})
        else
          double(success?: false, status: 500, body: {})
        end
      end
      res = client.send(:safe_post, 'path', {})
      expect(res[:ok]).to eq(false)
      # Faraday error path
      allow(conn).to receive(:post).and_raise(Faraday::ConnectionFailed.new('boom'))
      res2 = client.send(:safe_post, 'path', {})
      expect(res2[:ok]).to eq(false)
    end

    it 'try_endpoints_with_repairs retries removing invalid fields' do
      client = described_class.new(api_key: 'k', enabled: true)
      allow(client).to receive(:safe_post).and_return(
        { ok: false, status: 422, body: { 'errors' => ['person_locations invalid'] } },
        { ok: false, status: 422, body: { 'errors' => ['person_titles invalid'] } },
        { ok: true, status: 200, body: { 'people' => [] } }
      )
      body = client.send(:try_endpoints_with_repairs, ['people/search'], { person_locations: ['X'], person_titles: ['Y'] })
      expect(body).to be_a(Hash)
    end
  end

  describe '#probe' do
    it 'returns unauthorized hint when 401' do
      client = described_class.new(api_key: 'key', enabled: true)
      fake = instance_double(Faraday::Connection)
      client.instance_variable_set(:@conn, fake)
      allow(fake).to receive(:post).and_return(
        double(success?: false, status: 401, body: { 'error' => 'unauthorized' })
      )
      pr = client.probe
      expect(pr[:ok]).to eq(false)
      expect(pr[:hint]).to be_a(String)
    end
  end
end
