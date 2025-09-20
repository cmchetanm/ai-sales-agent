# frozen_string_literal: true

module Api
  module V1
    class LeadsController < Api::BaseController
      require 'csv'
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

      # POST /api/v1/leads/:id/qualify
      def qualify
        lead = current_account.leads.find(params[:id])
        authorize lead, :update?
        LeadQualificationJob.perform_later(lead_id: lead.id)
        render json: { status: 'queued' }, status: :accepted
      end

      # GET /api/v1/leads/export
      def export
        authorize Lead, :index?
        scope = policy_scope(current_account.leads)
        scope = apply_filters(scope)
        csv = CSV.generate(headers: true) do |out|
          out << %w[email first_name last_name company job_title location phone linkedin_url website status assigned_user_email score last_contacted_at source]
          scope.find_each do |l|
            out << [
              l.email,
              l.first_name,
              l.last_name,
              l.company,
              l.job_title,
              l.location,
              l.phone,
              l.linkedin_url,
              l.website,
              l.status,
              l.assigned_user&.email,
              l.score,
              l.last_contacted_at&.iso8601,
              l.source
            ]
          end
        end
        filename = "leads-#{Time.current.utc.strftime('%Y%m%d-%H%M%S')}.csv"
        send_data csv, filename:, type: 'text/csv; charset=utf-8'
      end

      # PATCH /api/v1/leads/bulk_update
      def bulk_update
        authorize Lead, :update?
        ids = Array(params[:ids]).map(&:to_i).uniq
        return render(json: { error: 'ids required' }, status: :bad_request) if ids.empty?

        attrs = params.fetch(:lead, {}).permit(:status, :pipeline_id, :assigned_user_id, :do_not_contact, :email_opt_out_at).to_h.symbolize_keys
        leads = policy_scope(current_account.leads).where(id: ids)
        pipeline = nil
        if attrs[:pipeline_id].present?
          pipeline = current_account.pipelines.find(attrs[:pipeline_id])
        end
        updated = 0
        leads.find_each do |l|
          l.pipeline = pipeline if pipeline
          l.assign_attributes(attrs.except(:pipeline_id))
          updated += 1 if l.save
        end
        render json: { updated: updated }, status: :ok
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
      end

      # POST /api/v1/leads/import
      # Accepts JSON { csv: "...string...", pipeline_id?, assigned_user_id? }
      def import
        authorize Lead, :create?
        csv = params[:csv].to_s
        return render(json: { error: 'csv required' }, status: :bad_request) if csv.blank?
        LeadImportJob.perform_later(account_id: current_account.id,
                                    csv: csv,
                                    pipeline_id: params[:pipeline_id],
                                    assigned_user_id: params[:assigned_user_id])
        render json: { status: 'queued' }, status: :accepted
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
          :assigned_user_id,
          :do_not_contact,
          :email_opt_out_at,
          :score,
          :last_contacted_at,
          enrichment: {}
        )
      end

      def apply_filters(scope)
        scope = scope.where(pipeline_id: params[:pipeline_id]) if params[:pipeline_id].present?
        scope = scope.where(status: params[:status]) if params[:status].present?
        scope = scope.where(assigned_user_id: params[:assigned_user_id]) if params[:assigned_user_id].present?
        scope = scope.where(do_not_contact: ActiveModel::Type::Boolean.new.cast(params[:do_not_contact])) if params.key?(:do_not_contact)
        scope = scope.where(source: params[:source]) if params[:source].present?
        scope = scope.where('company ILIKE ?', "%#{params[:company].to_s.strip}%") if params[:company].present?
        if params[:updated_after].present?
          if (t = safe_time(params[:updated_after]))
            scope = scope.where('updated_at >= ?', t)
          end
        end
        if params[:updated_before].present?
          if (t = safe_time(params[:updated_before]))
            scope = scope.where('updated_at <= ?', t)
          end
        end
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
        allowed = %w[email status created_at updated_at company score last_contacted_at first_name]
        if allowed.include?(order_by)
          scope.reorder(order_by => direction)
        else
          scope.order(created_at: :desc)
        end
      end

      def safe_time(val)
        s = val.to_s
        Time.zone.parse(s)
      rescue ArgumentError, TypeError
        nil
      end
    end
  end
end
