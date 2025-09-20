# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Lead, type: :model do
  it 'validates assigned_user belongs to same account' do
    a1 = create(:account)
    a2 = create(:account)
    u1 = create(:user, account: a1)
    u2 = create(:user, account: a2)
    p1 = create(:pipeline, account: a1)
    lead = a1.leads.create!(pipeline: p1, email: 'x@example.com')

    expect(lead.update(assigned_user: u1)).to be true
    expect(lead.update(assigned_user: u2)).to be false
    expect(lead.errors[:assigned_user_id]).to be_present
  end
end

