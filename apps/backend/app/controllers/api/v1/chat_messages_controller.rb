# frozen_string_literal: true

module Api
  module V1
    class ChatMessagesController < Api::BaseController
      def index
        session = current_account.chat_sessions.find(params[:chat_session_id])
        messages = session.chat_messages.order(:created_at)
        render json: { messages: messages.map { |m| serialize_message(m) } }
      end

      def create
        session = current_account.chat_sessions.find(params[:chat_session_id])
        user_msg = session.chat_messages.create!(sender_type: 'User', content: message_params[:content], sent_at: Time.current)

        llm = Ai::LlmClient.new
        context = session.chat_messages.order(:created_at).limit(20).map do |m|
          { role: m.sender_type == 'User' ? 'user' : 'assistant', content: m.content.to_s }
        end
        reply = llm.reply(session_id: session.id, account_id: current_account.id, user_id: current_user&.id, messages: context)
        assistant_msg = session.chat_messages.create!(sender_type: 'Assistant', content: reply, sent_at: Time.current)

        render json: {
          user: serialize_message(user_msg),
          assistant: serialize_message(assistant_msg)
        }, status: :created
      end

      private

      def message_params
        params.require(:message).permit(:content)
      end

      def serialize_message(m)
        { id: m.id, role: m.sender_type == 'User' ? 'user' : 'assistant', content: m.content, sent_at: m.sent_at }
      end
    end
  end
end

