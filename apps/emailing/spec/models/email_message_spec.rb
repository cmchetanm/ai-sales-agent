# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EmailMessage, type: :model do
  it 'validates status inclusion' do
    m = described_class.new(status: 'queued')
    m.valid?
    expect(m.errors[:status]).to be_empty
    m.status = 'bad'
    m.valid?
    expect(m.errors[:status]).not_to be_empty
  end
end

