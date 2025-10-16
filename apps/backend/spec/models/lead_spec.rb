# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Lead, type: :model do
  it 'downcases email and strips whitespace' do
    pipeline = create(:pipeline)
    l = pipeline.account.leads.create!(pipeline: pipeline, email: '  TEST@EXAMPLE.com  ', status: 'new')
    expect(l.reload.email).to eq('test@example.com')
  end

  it 'rejects assigned_user from other account' do
    pipeline = create(:pipeline)
    other_user = create(:user) # different account
    lead = pipeline.account.leads.create!(pipeline: pipeline, email: 'a@b.com', status: 'new')
    lead.assigned_user = other_user
    expect(lead.valid?).to be_falsey
    expect(lead.errors[:assigned_user_id]).to be_present
  end
end

