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

      def create
        campaign = current_account.campaigns.new(campaign_params)
        if campaign.pipeline_id.present?
          campaign.pipeline = current_account.pipelines.find(campaign.pipeline_id)
        end

        if campaign.save
          render json: { campaign: CampaignSerializer.new(campaign).serializable_hash }, status: :created
        else
          render json: { errors: campaign.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        campaign = current_account.campaigns.find(params[:id])
        if campaign_params.key?(:pipeline_id)
          campaign.pipeline = current_account.pipelines.find(campaign_params[:pipeline_id]) if campaign_params[:pipeline_id].present?
        end

        if campaign.update(campaign_params.except(:pipeline_id))
          render json: { campaign: CampaignSerializer.new(campaign).serializable_hash }
        else
          render json: { errors: campaign.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        campaign = current_account.campaigns.find(params[:id])
        campaign.destroy
        head :no_content
      end

      private

      def default_limit
        limit = params[:limit].to_i
        return 50 if limit <= 0
        [limit, 200].min
      end

      def campaign_params
        params.require(:campaign).permit(
          :pipeline_id,
          :name,
          :channel,
          :status,
          audience_filters: {},
          schedule: {},
          metrics: {}
        )
      end
    end
  end
end
