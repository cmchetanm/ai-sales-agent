# frozen_string_literal: true

module Api
  module V1
    class PipelinesController < Api::BaseController
      def index
        scope = policy_scope(current_account.pipelines).order(:created_at)
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
    end
  end
end
