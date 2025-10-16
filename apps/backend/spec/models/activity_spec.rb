# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Activity, type: :model do
  it 'requires at least one subject (lead/contact/deal)' do
    account = create(:account)
    a = Activity.new(account: account, kind: 'note', content: 'x', happened_at: Time.current)
    expect(a.valid?).to be_falsey
    expect(a.errors[:base]).to include('activity must belong to lead, contact, or deal')
  end
end

