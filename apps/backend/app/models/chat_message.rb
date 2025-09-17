# frozen_string_literal: true

class ChatMessage < ApplicationRecord
  belongs_to :chat_session
  belongs_to :sender, polymorphic: true, optional: true

  validates :sender_type, presence: true
  validates :content, presence: true
  validates :sent_at, presence: true
end
