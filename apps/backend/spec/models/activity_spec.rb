# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Activity, type: :model do
  let(:account) { create(:account) }
  let(:lead) { create(:lead, account:) }

  it 'is valid with required fields' do
    a = described_class.new(account:, lead:, kind: 'note', content: 'hello', happened_at: Time.current)
    expect(a).to be_valid
  end

  it 'requires kind in list' do
    a = described_class.new(account:, lead:, kind: 'x', happened_at: Time.current)
    expect(a).not_to be_valid
  end
end

