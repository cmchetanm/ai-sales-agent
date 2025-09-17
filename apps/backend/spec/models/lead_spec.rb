# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Lead, type: :model do
subject(:lead) { create(:lead) }

  it { is_expected.to belong_to(:account) }
  it { is_expected.to belong_to(:pipeline) }
  it { is_expected.to have_many(:email_messages).dependent(:destroy) }
  it { is_expected.to have_many(:follow_ups).dependent(:destroy) }
  it { is_expected.to validate_inclusion_of(:status).in_array(Lead::STATUSES) }
  describe 'email uniqueness' do
    it 'disallows duplicates within the same account' do
      existing = create(:lead, email: 'lead@example.com')
      duplicate = build(:lead, account: existing.account, pipeline: existing.pipeline, email: 'LEAD@example.com')

      expect(duplicate).not_to be_valid
    end

    it 'allows the same email across different accounts' do
      create(:lead, email: 'lead@example.com')
      other_account = create(:account)
      lead = build(:lead, account: other_account, pipeline: build(:pipeline, account: other_account), email: 'lead@example.com')

      expect(lead).to be_valid
    end
  end
end
