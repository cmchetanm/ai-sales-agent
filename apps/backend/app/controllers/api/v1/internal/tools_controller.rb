# frozen_string_literal: true

module Api
  module V1
    module Internal
      class ToolsController < BaseController
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
      end
    end
  end
end
