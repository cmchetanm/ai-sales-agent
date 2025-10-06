# frozen_string_literal: true

class ChatSessionChannel < ApplicationCable::Channel
  def subscribed
    sid = params[:id] || params[:chat_session_id]
    reject && return unless sid.present?
    stream_from("chat_session:#{sid}")
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end

