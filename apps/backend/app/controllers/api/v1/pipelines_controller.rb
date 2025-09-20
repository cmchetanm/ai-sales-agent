# frozen_string_literal: true

module Api
  module V1
    class PipelinesController < Api::BaseController
      def index
        scope = policy_scope(current_account.pipelines)
        if params[:q].present?
          q = "%#{params[:q].to_s.downcase}%"
          scope = scope.where('LOWER(name) LIKE :q OR LOWER(status) LIKE :q', q:)
        end
        scope = apply_sort(scope)
        @pagy, records = pagy(scope, items: per_page)
        render json: {
          pipelines: records.map { |p| PipelineSerializer.new(p).serializable_hash },
          pagination: pagy_meta(@pagy)
        }
      end

      def show
        pipeline = current_account.pipelines.find(params[:id])
        authorize pipeline
        render json: { pipeline: PipelineSerializer.new(pipeline).serializable_hash }
      end

      def create
        pipeline = current_account.pipelines.new(pipeline_params)
        authorize pipeline
        if pipeline.save
          render json: { pipeline: PipelineSerializer.new(pipeline).serializable_hash }, status: :created
        else
          render json: { errors: pipeline.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        pipeline = current_account.pipelines.find(params[:id])
        authorize pipeline
        if pipeline.update(pipeline_params)
          render json: { pipeline: PipelineSerializer.new(pipeline).serializable_hash }
        else
          render json: { errors: pipeline.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        pipeline = current_account.pipelines.find(params[:id])
        authorize pipeline
        pipeline.destroy
        head :no_content
      end

      # GET /api/v1/pipelines/:id/stats
      def stats
        pipeline = current_account.pipelines.find(params[:id])
        authorize pipeline, :show?
        render json: { pipeline_id: pipeline.id, stage_stats: pipeline.stage_stats, status_counts: pipeline.status_counts }
      end

      private

      def pipeline_params
        params.require(:pipeline).permit(:name, :description, :status, :primary, stage_definitions: [:name])
      end

      def per_page
        (params[:per_page].presence || Pagy::DEFAULT[:items]).to_i
      end

      def pagy_meta(p)
        { page: p.page, items: p.items, count: p.count, pages: p.pages }
      end

      def apply_sort(scope)
        order_by = params[:order_by].presence || 'created_at'
        direction = params[:order].to_s.downcase == 'desc' ? :desc : :asc
        allowed = %w[name status created_at updated_at]
        if allowed.include?(order_by)
          scope.reorder(order_by => direction)
        else
          scope.order(:created_at)
        end
      end
    end
  end
end
