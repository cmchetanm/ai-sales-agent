# frozen_string_literal: true

module Api
  module V1
    class CampaignsController < Api::BaseController
      def index
        scope = current_account.campaigns.order(created_at: :desc)
        scope = scope.where(pipeline_id: params[:pipeline_id]) if params[:pipeline_id].present?
        scope = scope.where(status: params[:status]) if params[:status].present?

        campaigns = scope.limit(default_limit)
        render json: { campaigns: campaigns.map { |c| CampaignSerializer.new(c).serializable_hash } }
      end

      def show
        campaign = current_account.campaigns.find(params[:id])
        render json: { campaign: CampaignSerializer.new(campaign).serializable_hash }
      end

      private

      def default_limit
        limit = params[:limit].to_i
        return 50 if limit <= 0
        [limit, 200].min
      end
    end
  end
end

