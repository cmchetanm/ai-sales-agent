# frozen_string_literal: true

class ChatMessage < ApplicationRecord
  belongs_to :chat_session
  belongs_to :sender, polymorphic: true, optional: true

  validates :sender_type, presence: true
  validates :content, presence: true
  validates :sent_at, presence: true

  after_create_commit :broadcast_created

  private

  def broadcast_created
    payload = {
      event: 'message.created',
      message: {
        id: id,
        role: sender_type == 'User' ? 'user' : 'assistant',
        content: content,
        sent_at: sent_at
      }
    }
    ActionCable.server.broadcast("chat_session:#{chat_session_id}", payload)
  rescue StandardError => e
    Rails.logger.warn("ChatMessage broadcast failed: #{e.class}: #{e.message}")
  end
end
