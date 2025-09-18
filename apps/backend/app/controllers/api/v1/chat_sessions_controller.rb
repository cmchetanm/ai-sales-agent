# frozen_string_literal: true

module Api
  module V1
    class ChatSessionsController < Api::BaseController
      def create
        session = current_account.chat_sessions.create!(user: current_user, status: 'active')
        render json: { chat_session: { id: session.id, status: session.status } }, status: :created
      end

      def show
        session = current_account.chat_sessions.find(params[:id])
        messages = session.chat_messages.order(:created_at).map { |m| serialize_message(m) }
        render json: { chat_session: { id: session.id, status: session.status, messages: } }
      end

      private

      def serialize_message(m)
        { id: m.id, role: m.sender_type == 'User' ? 'user' : 'assistant', content: m.content, sent_at: m.sent_at }
      end
    end
  end
end

