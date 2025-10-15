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
        filters = params.require(:filters).permit(:keywords, :role, :location, :limit).to_h.symbolize_keys
        sync = ActiveModel::Type::Boolean.new.cast(params[:sync]) ||
               (Rails.env.development? && ActiveModel::Type::Boolean.new.cast(ENV.fetch('INTERNAL_SYNC_JOBS', 'false')))
        if sync
          before_time = Time.current
          ApolloFetchJob.perform_now(account_id: account.id, filters:)
          created_scope = account.leads.where('created_at >= ?', before_time).where(source: 'apollo')
          created_count = created_scope.count
          rows = created_scope
          # Fallback: if nothing new was created (e.g., updates only), return recent apollo leads so the caller can show something real
          if created_count.zero?
            rows = account.leads.where(source: 'apollo').order(updated_at: :desc)
          end
          rows = rows.order(Arel.sql('COALESCE(score, 0) DESC')).limit((filters[:limit] || 10).to_i)
          sample = rows.map { |l| { id: l.id, first_name: l.first_name, last_name: l.last_name, email: l.email, company: l.company, job_title: l.job_title } }
          render json: { status: 'ok', mode: 'sync', created: created_count, sample: sample }, status: :ok
        else
          ApolloFetchJob.perform_later(account_id: account.id, filters:)
          render json: { status: 'queued' }, status: :accepted
        end
      end

      def discover_leads
        account = Account.find(params.require(:account_id))
        filters = params.require(:filters).permit(:keywords, :role, :location).to_h.symbolize_keys
        sync = ActiveModel::Type::Boolean.new.cast(params[:sync]) ||
               (Rails.env.development? && ActiveModel::Type::Boolean.new.cast(ENV.fetch('INTERNAL_SYNC_JOBS', 'false')))
        if sync
          before_time = Time.current
          LeadDiscoveryJob.perform_now(account_id: account.id, filters:)
          created_scope = account.leads.where('created_at >= ?', before_time)
          sample = created_scope.limit(5).map { |l| { first_name: l.first_name, last_name: l.last_name, email: l.email, company: l.company } }
          render json: { status: 'ok', mode: 'sync', created: created_scope.count, sample: sample }, status: :ok
        else
          LeadDiscoveryJob.perform_later(account_id: account.id, filters:)
          render json: { status: 'queued' }, status: :accepted
        end
      end

      # POST /api/v1/internal/chat_notify
      # params: { account_id, chat_session_id, content }
      def chat_notify
        account = Account.find(params.require(:account_id))
        session = account.chat_sessions.find(params.require(:chat_session_id))
        content = params.require(:content)
        msg = session.chat_messages.create!(sender_type: 'Assistant', content: content.to_s, sent_at: Time.current)
        render json: { status: 'ok', message_id: msg.id }
      end

      # GET /api/v1/internal/lead_packs/:id/export
      def export_lead_pack
        account = Account.find(params.require(:account_id))
        pack = account.lead_packs.find(params.require(:id))
        leads = account.leads.where(id: pack.lead_ids)
        if ActiveModel::Type::Boolean.new.cast(params[:unlocked_only])
          leads = leads.where(locked: false).where.not(email: [nil, ''])
        end
        csv = CSV.generate(headers: true) do |out|
          out << %w[email first_name last_name company job_title location phone linkedin_url website source locked score verification_status]
          leads.find_each do |l|
            out << [l.email, l.first_name, l.last_name, l.company, l.job_title, l.location, l.phone, l.linkedin_url, l.website, l.source, l.locked, l.score, l.verification_status]
          end
        end
        send_data csv, filename: "lead-pack-#{pack.id}.csv", type: 'text/csv; charset=utf-8'
      end

      # POST /api/v1/internal/lead_packs/:id/bulk_update
      # { account_id, lead: { assigned_user_id?, do_not_contact? } }
      def bulk_update_lead_pack
        account = Account.find(params.require(:account_id))
        pack = account.lead_packs.find(params.require(:id))
        attrs = params.require(:lead).permit(:assigned_user_id, :do_not_contact).to_h.symbolize_keys
        leads = account.leads.where(id: pack.lead_ids)
        updated = 0
        leads.find_each do |l|
          l.assign_attributes(attrs)
          updated += 1 if l.save
        end
        render json: { status: 'ok', updated: updated }
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

      public

      # POST /api/v1/internal/lead_packs
      # { account_id, name?, lead_ids?: [], filters?: {} }
      def create_lead_pack
        account = Account.find(params.require(:account_id))
        name = params[:name].presence || "Pack #{Time.current.strftime('%Y%m%d-%H%M')}"
        lead_ids = Array(params[:lead_ids]).map(&:to_i).uniq
        filters = params[:filters].is_a?(ActionController::Parameters) ? params[:filters].permit!.to_h : (params[:filters] || {})
        if lead_ids.empty?
          # fallback to filters to resolve IDs
          scope = account.leads
          scope = scope.where(source: filters['source']) if filters['source']
          scope = scope.where('LOWER(job_title) LIKE ?', "%#{filters['role'].to_s.downcase}%") if filters['role']
          scope = scope.where('LOWER(company) LIKE ?', "%#{filters['company'].to_s.downcase}%") if filters['company']
          lead_ids = scope.limit(100).pluck(:id)
        end
        pack = account.lead_packs.create!(name: name, lead_ids: lead_ids, filters: filters)
        render json: { status: 'ok', lead_pack: { id: pack.id, name: pack.name, size: pack.lead_ids.size } }, status: :ok
      end
      end
    end
  end
end
