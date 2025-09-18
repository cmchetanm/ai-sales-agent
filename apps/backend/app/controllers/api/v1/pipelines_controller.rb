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
    end
  end
end

