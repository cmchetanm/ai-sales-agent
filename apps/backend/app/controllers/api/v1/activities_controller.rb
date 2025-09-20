# frozen_string_literal: true

module Api
  module V1
    class ActivitiesController < Api::BaseController
      def index
        lead = current_account.leads.find(params[:lead_id])
        authorize lead, :show?
        scope = lead.activities.order(happened_at: :desc)
        @pagy, records = pagy(scope, items: per_page)
        render json: { activities: records.map { |a| ActivitySerializer.new(a).serializable_hash }, pagination: pagy_meta(@pagy) }
      end

      def create
        lead = current_account.leads.find(params[:lead_id])
        authorize lead, :update?
        activity = lead.activities.new(activity_params.merge(account_id: current_account.id, happened_at: Time.current))
        if activity.save
          lead.update!(last_contacted_at: activity.happened_at) if %w[email_sent email_replied call meeting].include?(activity.kind)
          render json: { activity: ActivitySerializer.new(activity).serializable_hash }, status: :created
        else
          render json: { errors: activity.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def per_page
        (params[:per_page].presence || Pagy::DEFAULT[:items]).to_i
      end

      def pagy_meta(p)
        { page: p.page, items: p.items, count: p.count, pages: p.pages }
      end

      def activity_params
        params.require(:activity).permit(:kind, :content, :campaign_id, metadata: {})
      end
    end
  end
end

