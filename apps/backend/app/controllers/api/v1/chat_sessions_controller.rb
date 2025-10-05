# frozen_string_literal: true

module Api
  module V1
    class ChatSessionsController < Api::BaseController
      def index
        sessions = current_account.chat_sessions.order(created_at: :desc)
        render json: { chat_sessions: sessions.map { |s| { id: s.id, status: s.status } } }
      end

      def create
        session = current_account.chat_sessions.create!(user: current_user, status: 'active')
        render json: { chat_session: { id: session.id, status: session.status } }, status: :created
      end

      def show
        session = current_account.chat_sessions.find(params[:id])
        messages = session.chat_messages.order(:created_at).map { |m| serialize_message(m) }
        render json: { chat_session: { id: session.id, status: session.status, messages: } }
      end

      def pause
        session = current_account.chat_sessions.find(params[:id])
        session.update!(status: 'paused')
        render json: { chat_session: { id: session.id, status: session.status } }
      end

      def resume
        session = current_account.chat_sessions.find(params[:id])
        session.update!(status: 'active')
        render json: { chat_session: { id: session.id, status: session.status } }
      end

      def complete
        session = current_account.chat_sessions.find(params[:id])
        session.update!(status: 'completed')
        render json: { chat_session: { id: session.id, status: session.status } }
      end

      private

      def serialize_message(m)
        { id: m.id, role: m.sender_type == 'User' ? 'user' : 'assistant', content: m.content, sent_at: m.sent_at }
      end
    end
  end
end
