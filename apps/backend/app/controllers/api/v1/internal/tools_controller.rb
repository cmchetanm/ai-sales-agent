# frozen_string_literal: true

module Api
  module V1
    module Internal
      class ToolsController < BaseController
        def ping
          head :ok
        end
        def profile_update
          account = Account.find(params.require(:account_id))
          account.create_profile unless account.profile
          profile_attrs = params.require(:profile).permit(:summary, target_industries: [], target_roles: [], target_locations: [], ideal_customer_profile: {}, questionnaire: {})
          account.profile.update!(profile_attrs)
          render json: { status: 'ok' }
        end

      def apollo_fetch
        account = Account.find(params.require(:account_id))
        filters = params.require(:filters).permit(:keywords, :role, :location).to_h.symbolize_keys
        ApolloFetchJob.perform_later(account_id: account.id, filters:)
        render json: { status: 'queued' }, status: :accepted
      end

      def discover_leads
        account = Account.find(params.require(:account_id))
        filters = params.require(:filters).permit(:keywords, :role, :location).to_h.symbolize_keys
        LeadDiscoveryJob.perform_later(account_id: account.id, filters:)
        render json: { status: 'queued' }, status: :accepted
      end

      # Synchronous DB preview search (no external vendors)
      def db_preview_leads
        account = Account.find(params.require(:account_id))
        filters = params.require(:filters).permit(:keywords, :role, :location).to_h.symbolize_keys
        limit = params[:limit].presence&.to_i || 5
        rows, total = db_search(account, filters, limit)
        render json: { status: 'ok', total:, results: rows }
      end

      # Mark a chat session as completed
      def close_chat
        account = Account.find(params.require(:account_id))
        session = account.chat_sessions.find(params.require(:chat_session_id))
        session.update!(status: 'completed')
        render json: { status: 'ok' }
      end

      # POST /api/v1/internal/email_event
      # { message_id?, external_id?, tracking_token?, status: 'opened'|'replied'|'bounced'|'clicked'|'delivered' }
      def email_event
        ident = params.permit(:message_id, :external_id, :tracking_token, :status, :campaign_id, :lead_id)
        status = ident[:status].to_s
        msg = if ident[:message_id]
                EmailMessage.find_by(id: ident[:message_id])
              elsif ident[:tracking_token]
                EmailMessage.find_by(tracking_token: ident[:tracking_token])
              elsif ident[:external_id]
                EmailMessage.find_by(external_id: ident[:external_id])
              end
        return render json: { error: 'not_found' }, status: :not_found unless msg
        msg.update!(status: status, sent_at: (msg.sent_at || Time.current))

        campaign = msg.campaign
        lead = msg.lead
        # Basic automation: cancel future queued messages if replied or bounced, mark DNC on bounce
        if %w[replied bounced].include?(status)
          cancel_future_messages(campaign, lead)
          lead.update!(do_not_contact: true) if status == 'bounced'
        end
        # Update metrics
        update_metrics!(campaign, status, msg.metadata['variant']) if campaign
        render json: { status: 'ok' }
      end

      private

      def cancel_future_messages(campaign, lead)
        return unless campaign && lead
        campaign.email_messages.where(lead_id: lead.id, status: 'queued').find_each do |m|
          # Using sent_at as scheduled_at placeholder
          next if m.sent_at && m.sent_at <= Time.current
          m.update(status: 'cancelled')
        end
      end

      def update_metrics!(campaign, status, variant)
        metrics = campaign.metrics || {}
        metrics['events'] ||= {}
        metrics['events'][status] = metrics['events'].fetch(status, 0) + 1
        if variant.present?
          metrics['variants'] ||= {}
          v = (metrics['variants'][variant] ||= {})
          v[status] = v.fetch(status, 0) + 1
        end
        campaign.update_column(:metrics, metrics)
      end

      def db_search(account, filters, limit)
        q = filters[:keywords].to_s.downcase
        role = filters[:role].to_s.downcase
        location = filters[:location].to_s.downcase
        scope = account.leads
        conditions = []
        params = {}
        unless q.blank?
          conditions << '(LOWER(email) LIKE :q OR LOWER(company) LIKE :q OR LOWER(first_name) LIKE :q OR LOWER(last_name) LIKE :q)'
          params[:q] = "%#{q}%"
        end
        unless role.blank?
          conditions << 'LOWER(job_title) LIKE :role'
          params[:role] = "%#{role}%"
        end
        unless location.blank?
          conditions << 'LOWER(location) LIKE :loc'
          params[:loc] = "%#{location}%"
        end
        return [[], 0] if conditions.empty?
        rel = scope.where(conditions.join(' AND '), params)
        total = rel.count
        rows = rel.limit(limit).map do |l|
          { first_name: l.first_name, last_name: l.last_name, email: l.email, company: l.company }
        end
        [rows, total]
      end
      end
    end
  end
end
