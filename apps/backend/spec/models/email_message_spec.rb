# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EmailMessage, type: :model do
subject(:email_message) { create(:email_message) }

  it { is_expected.to belong_to(:account) }
  it { is_expected.to belong_to(:campaign) }
  it { is_expected.to belong_to(:lead) }
  it { is_expected.to validate_inclusion_of(:direction).in_array(EmailMessage::DIRECTIONS) }
  it { is_expected.to validate_inclusion_of(:status).in_array(EmailMessage::STATUSES) }
  it { is_expected.to validate_uniqueness_of(:tracking_token).allow_nil }
end
