# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Deal, type: :model do
  let(:account) { create(:account) }

  it 'validates stage inclusion and probability bounds' do
    d = account.deals.new(name: 'X', amount_cents: 1000, stage: 'invalid', probability: 200)
    expect(d.valid?).to be_falsey
    d.stage = 'qualification'
    d.probability = 50
    expect(d.valid?).to be_truthy
  end

  it 'requires non-negative amount' do
    d = account.deals.new(name: 'Y', amount_cents: -1, stage: 'qualification')
    expect(d.valid?).to be_falsey
  end
end

