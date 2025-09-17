# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ChatSession, type: :model do
  subject(:chat_session) { build(:chat_session) }

  it { is_expected.to belong_to(:account) }
  it { is_expected.to belong_to(:user).optional(true) }
  it { is_expected.to have_many(:chat_messages).dependent(:destroy) }
  it { is_expected.to validate_inclusion_of(:status).in_array(ChatSession::STATUSES) }
end
