# frozen_string_literal: true

module Api
  module V1
    class LeadsController < Api::BaseController
      def index
        scope = current_account.leads.order(created_at: :desc)
        scope = scope.where(pipeline_id: params[:pipeline_id]) if params[:pipeline_id].present?
        scope = scope.where(status: params[:status]) if params[:status].present?

        leads = scope.limit(default_limit)
        render json: { leads: leads.map { |l| LeadSerializer.new(l).serializable_hash } }
      end

      def show
        lead = current_account.leads.find(params[:id])
        render json: { lead: LeadSerializer.new(lead).serializable_hash }
      end

      def create
        pipeline = current_account.pipelines.find(lead_params[:pipeline_id])
        lead = current_account.leads.new(lead_params.merge(pipeline:))
        if lead.save
          render json: { lead: LeadSerializer.new(lead).serializable_hash }, status: :created
        else
          render json: { errors: lead.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        lead = current_account.leads.find(params[:id])
        if updating_pipeline?
          pipeline = current_account.pipelines.find(lead_params[:pipeline_id])
          lead.pipeline = pipeline
        end
        if lead.update(lead_params.except(:pipeline_id))
          render json: { lead: LeadSerializer.new(lead).serializable_hash }
        else
          render json: { errors: lead.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        lead = current_account.leads.find(params[:id])
        lead.destroy
        head :no_content
      end

      private

      def default_limit
        limit = params[:limit].to_i
        return 50 if limit <= 0
        [limit, 200].min
      end

      def updating_pipeline?
        lead_params.key?(:pipeline_id)
      end

      def lead_params
        params.require(:lead).permit(
          :pipeline_id,
          :source,
          :external_id,
          :status,
          :first_name,
          :last_name,
          :email,
          :company,
          :job_title,
          :location,
          :phone,
          :linkedin_url,
          :website,
          :score,
          :last_contacted_at,
          enrichment: {}
        )
      end
    end
  end
end
