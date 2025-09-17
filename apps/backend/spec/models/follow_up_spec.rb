# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FollowUp, type: :model do
  subject(:follow_up) { build(:follow_up) }

  it { is_expected.to belong_to(:account) }
  it { is_expected.to belong_to(:campaign).optional(true) }
  it { is_expected.to belong_to(:lead) }
  it { is_expected.to validate_inclusion_of(:channel).in_array(FollowUp::CHANNELS) }
  it { is_expected.to validate_inclusion_of(:status).in_array(FollowUp::STATUSES) }
  it { is_expected.to validate_presence_of(:execute_at) }
end
