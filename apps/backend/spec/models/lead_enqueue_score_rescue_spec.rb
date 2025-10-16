# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Lead, type: :model do
  it 'rescues enqueue failures and inline failures' do
    account = create(:account)
    pipe = create(:pipeline, account: account)
    lead = build(:lead, account: account, pipeline: pipe)
    allow(LeadScoreJob).to receive(:perform_later).and_raise(StandardError.new('later failed'))
    allow(LeadScoreJob).to receive(:perform_now).and_raise(StandardError.new('now failed'))
    expect { lead.save! }.not_to raise_error
  end
end

