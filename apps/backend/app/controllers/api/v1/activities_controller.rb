# frozen_string_literal: true

module Api
  module V1
    class ActivitiesController < Api::BaseController
      def index
        subject = find_subject!
        authorize subject, :show?
        scope = current_account.activities
        scope = scope.where(lead_id: subject.id)   if subject.is_a?(Lead)
        scope = scope.where(contact_id: subject.id) if subject.is_a?(Contact)
        scope = scope.where(deal_id: subject.id)   if subject.is_a?(Deal)
        if subject.is_a?(Company)
          contact_ids = subject.contacts.select(:id)
          deal_ids = subject.deals.select(:id)
          scope = scope.where(contact_id: contact_ids).or(current_account.activities.where(deal_id: deal_ids))
        end
        if params[:kind].present?
          scope = scope.where(kind: params[:kind])
        end
        if params[:happened_after].present?
          if (t = safe_time(params[:happened_after]))
            scope = scope.where('happened_at >= ?', t)
          end
        end
        if params[:happened_before].present?
          if (t = safe_time(params[:happened_before]))
            scope = scope.where('happened_at <= ?', t)
          end
        end
        scope = scope.includes(:contact, :deal).order(happened_at: :desc)
        @pagy, records = pagy(scope, items: per_page)
        render json: { activities: records.map { |a| ActivitySerializer.new(a).serializable_hash }, pagination: pagy_meta(@pagy) }
      end

      def create
        subject = find_subject!
        authorize subject, :update?
        attrs = activity_params.merge(account_id: current_account.id, happened_at: Time.current)
        activity = Activity.new(attrs)
        if subject.is_a?(Lead)
          activity.lead_id = subject.id
        elsif subject.is_a?(Contact)
          activity.contact_id = subject.id
        elsif subject.is_a?(Deal)
          activity.deal_id = subject.id
        end
        if activity.save
          if subject.is_a?(Lead) && %w[email_sent email_replied call meeting].include?(activity.kind)
            subject.update!(last_contacted_at: activity.happened_at)
          end
          render json: { activity: ActivitySerializer.new(activity).serializable_hash }, status: :created
        else
          render json: { errors: activity.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def find_subject!
        if params[:lead_id].present?
          return current_account.leads.find(params[:lead_id])
        elsif params[:contact_id].present?
          return current_account.contacts.find(params[:contact_id])
        elsif params[:deal_id].present?
          return current_account.deals.find(params[:deal_id])
        elsif params[:company_id].present?
          return current_account.companies.find(params[:company_id])
        end
        raise ActiveRecord::RecordNotFound, 'subject not found'
      end

      def per_page
        (params[:per_page].presence || Pagy::DEFAULT[:items]).to_i
      end

      def pagy_meta(p)
        { page: p.page, items: p.items, count: p.count, pages: p.pages }
      end

      def activity_params
        params.require(:activity).permit(:kind, :content, :campaign_id, metadata: {})
      end

      def safe_time(val)
        s = val.to_s
        Time.zone.parse(s)
      rescue ArgumentError, TypeError
        nil
      end
    end
  end
end
