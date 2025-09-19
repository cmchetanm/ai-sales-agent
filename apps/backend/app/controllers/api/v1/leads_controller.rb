# frozen_string_literal: true

module Api
  module V1
    class LeadsController < Api::BaseController
      def index
        scope = policy_scope(current_account.leads)
        scope = apply_filters(scope)
        scope = apply_sort(scope)

        @pagy, records = pagy(scope, items: per_page)
        render json: {
          leads: records.map { |l| LeadSerializer.new(l).serializable_hash },
          pagination: pagy_meta(@pagy)
        }
      end

      def show
        lead = current_account.leads.find(params[:id])
        authorize lead
        render json: { lead: LeadSerializer.new(lead).serializable_hash }
      end

      def create
        pipeline = current_account.pipelines.find(lead_params[:pipeline_id])
        lead = current_account.leads.new(lead_params.merge(pipeline:))
        authorize lead
        if lead.save
          render json: { lead: LeadSerializer.new(lead).serializable_hash }, status: :created
        else
          render json: { errors: lead.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        lead = current_account.leads.find(params[:id])
        authorize lead
        if updating_pipeline?
          pipeline = current_account.pipelines.find(lead_params[:pipeline_id])
          lead.pipeline = pipeline
        end
        if lead.update(lead_params.except(:pipeline_id))
          render json: { lead: LeadSerializer.new(lead).serializable_hash }
        else
          render json: { errors: lead.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        lead = current_account.leads.find(params[:id])
        authorize lead
        lead.destroy
        head :no_content
      end

      private

      def per_page
        (params[:per_page].presence || Pagy::DEFAULT[:items]).to_i
      end

      def pagy_meta(p)
        { page: p.page, items: p.items, count: p.count, pages: p.pages }
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

      def apply_filters(scope)
        scope = scope.where(pipeline_id: params[:pipeline_id]) if params[:pipeline_id].present?
        scope = scope.where(status: params[:status]) if params[:status].present?
        if params[:q].present?
          q = "%#{params[:q].to_s.downcase}%"
          scope = scope.where(
            'LOWER(email) LIKE :q OR LOWER(company) LIKE :q OR LOWER(first_name) LIKE :q OR LOWER(last_name) LIKE :q',
            q:
          )
        end
        scope
      end

      def apply_sort(scope)
        order_by = params[:order_by].presence || 'created_at'
        direction = params[:order].to_s.downcase == 'asc' ? :asc : :desc
        allowed = %w[email status created_at updated_at company score]
        if allowed.include?(order_by)
          scope.reorder(order_by => direction)
        else
          scope.order(created_at: :desc)
        end
      end
    end
  end
end
