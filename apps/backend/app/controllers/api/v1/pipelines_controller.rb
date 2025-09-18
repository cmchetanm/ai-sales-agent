# frozen_string_literal: true

module Api
  module V1
    class PipelinesController < Api::BaseController
      def index
        pipelines = current_account.pipelines.order(:created_at)
        render json: { pipelines: pipelines.map { |p| PipelineSerializer.new(p).serializable_hash } }
      end

      def show
        pipeline = current_account.pipelines.find(params[:id])
        render json: { pipeline: PipelineSerializer.new(pipeline).serializable_hash }
      end

      def create
        pipeline = current_account.pipelines.new(pipeline_params)
        if pipeline.save
          render json: { pipeline: PipelineSerializer.new(pipeline).serializable_hash }, status: :created
        else
          render json: { errors: pipeline.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        pipeline = current_account.pipelines.find(params[:id])
        if pipeline.update(pipeline_params)
          render json: { pipeline: PipelineSerializer.new(pipeline).serializable_hash }
        else
          render json: { errors: pipeline.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        pipeline = current_account.pipelines.find(params[:id])
        pipeline.destroy
        head :no_content
      end

      private

      def pipeline_params
        params.require(:pipeline).permit(:name, :description, :status, :primary, stage_definitions: [:name])
      end
    end
  end
end
