# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Integrations::SalesforceClient do
  it 'returns empty array when not ready' do
    client = described_class.new(client_id: nil)
    res = client.search_people(keywords: 'saas')
    expect(res).to eq([])
  end

  it 'returns results when ready (placeholder returns empty until implemented)' do
    client = described_class.new(client_id: 'x')
    res = client.search_people(keywords: 'saas')
    expect(res).to eq([])
  end
end
