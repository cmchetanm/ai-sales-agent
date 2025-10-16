# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Integrations::LinkedinClient do
  it 'reports readiness and returns empty search results' do
    c1 = described_class.new(api_key: nil)
    expect(c1.ready?).to eq(false)
    expect(c1.search_people({})).to eq([])
    c2 = described_class.new(api_key: 'x')
    expect(c2.ready?).to eq(true)
    expect(c2.search_people({})).to eq([])
  end
end

