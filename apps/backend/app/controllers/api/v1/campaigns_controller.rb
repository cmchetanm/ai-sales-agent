# frozen_string_literal: true

module Api
  module V1
    class CampaignsController < Api::BaseController
      def index
        scope = policy_scope(current_account.campaigns)
        scope = scope.where(pipeline_id: params[:pipeline_id]) if params[:pipeline_id].present?
        scope = scope.where(status: params[:status]) if params[:status].present?
        if params[:q].present?
          q = "%#{params[:q].to_s.downcase}%"
          scope = scope.where('LOWER(name) LIKE :q', q:)
        end
        scope = apply_sort(scope)

        @pagy, records = pagy(scope, items: per_page)
        render json: {
          campaigns: records.map { |c| CampaignSerializer.new(c).serializable_hash },
          pagination: pagy_meta(@pagy)
        }
      end

      def show
        campaign = current_account.campaigns.find(params[:id])
        authorize campaign
        render json: { campaign: CampaignSerializer.new(campaign).serializable_hash }
      end

      def create
        campaign = current_account.campaigns.new(campaign_params)
        if campaign.pipeline_id.present?
          campaign.pipeline = current_account.pipelines.find(campaign.pipeline_id)
        end

        authorize campaign
        if campaign.save
          render json: { campaign: CampaignSerializer.new(campaign).serializable_hash }, status: :created
        else
          render json: { errors: campaign.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        campaign = current_account.campaigns.find(params[:id])
        authorize campaign
        if campaign_params.key?(:pipeline_id)
          campaign.pipeline = current_account.pipelines.find(campaign_params[:pipeline_id]) if campaign_params[:pipeline_id].present?
        end

        if campaign.update(campaign_params.except(:pipeline_id))
          render json: { campaign: CampaignSerializer.new(campaign).serializable_hash }
        else
          render json: { errors: campaign.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        campaign = current_account.campaigns.find(params[:id])
        authorize campaign
        campaign.destroy
        head :no_content
      end

      private

      def per_page
        (params[:per_page].presence || Pagy::DEFAULT[:items]).to_i
      end

      def pagy_meta(p)
        { page: p.page, items: p.items, count: p.count, pages: p.pages }
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

      def apply_sort(scope)
        order_by = params[:order_by].presence || 'created_at'
        direction = params[:order].to_s.downcase == 'asc' ? :asc : :desc
        allowed = %w[name status created_at updated_at]
        if allowed.include?(order_by)
          scope.reorder(order_by => direction)
        else
          scope.order(created_at: :desc)
        end
      end
    end
  end
end
