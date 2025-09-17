# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Campaign, type: :model do
subject(:campaign) { create(:campaign) }

  it { is_expected.to belong_to(:account) }
  it { is_expected.to belong_to(:pipeline).optional(true) }
  it { is_expected.to have_many(:email_messages).dependent(:destroy) }
  it { is_expected.to have_many(:follow_ups).dependent(:destroy) }
  it { is_expected.to validate_presence_of(:name) }
  it { is_expected.to validate_uniqueness_of(:name).scoped_to(:account_id) }
  it { is_expected.to validate_inclusion_of(:channel).in_array(Campaign::CHANNELS) }
  it { is_expected.to validate_inclusion_of(:status).in_array(Campaign::STATUSES) }
end
