# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ChatMessage, type: :model do
  subject(:chat_message) { build(:chat_message) }

  it { is_expected.to belong_to(:chat_session) }
  it { is_expected.to belong_to(:sender).optional(true) }
  it { is_expected.to validate_presence_of(:sender_type) }
  it { is_expected.to validate_presence_of(:content) }
  it { is_expected.to validate_presence_of(:sent_at) }
end
