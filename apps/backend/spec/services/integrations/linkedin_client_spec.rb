# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Integrations::LinkedinClient do
  it 'returns empty array when no API key' do
    client = described_class.new(api_key: nil)
    res = client.search_people(role: 'cto', keywords: 'saas')
    expect(res).to eq([])
  end
end
