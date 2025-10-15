# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Integrations::HubspotClient do
  it 'returns empty array when no API key' do
    client = described_class.new(api_key: nil)
    res = client.search_people(keywords: 'saas', role: 'cto')
    expect(res).to eq([])
  end
end
