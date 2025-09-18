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

      private

      def default_limit
        limit = params[:limit].to_i
        return 50 if limit <= 0
        [limit, 200].min
      end
    end
  end
end

