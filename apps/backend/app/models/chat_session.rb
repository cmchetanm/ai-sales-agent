# frozen_string_literal: true

class ChatSession < ApplicationRecord
  STATUSES = %w[active paused completed archived].freeze

  belongs_to :account
  belongs_to :user, optional: true
  has_many :chat_messages, dependent: :destroy

  validates :status, inclusion: { in: STATUSES }
end
