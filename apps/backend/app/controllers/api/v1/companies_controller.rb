# frozen_string_literal: true

module Api
  module V1
    class CompaniesController < Api::BaseController
      def index
        scope = policy_scope(current_account.companies)
        if params[:q].present?
          q = "%#{params[:q].to_s.downcase}%"
          scope = scope.where('LOWER(name) LIKE :q OR LOWER(domain) LIKE :q', q:)
        end
        @pagy, records = pagy(scope.order(updated_at: :desc), items: per_page)
        render json: { companies: records.map { |c| CompanySerializer.new(c).serializable_hash }, pagination: pagy_meta(@pagy) }
      end

      def show
        company = current_account.companies.find(params[:id])
        authorize company
        render json: { company: CompanySerializer.new(company).serializable_hash }
      end

      def create
        company = current_account.companies.new(company_params)
        authorize company
        if company.save
          render json: { company: CompanySerializer.new(company).serializable_hash }, status: :created
        else
          render json: { errors: company.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        company = current_account.companies.find(params[:id])
        authorize company
        if company.update(company_params)
          render json: { company: CompanySerializer.new(company).serializable_hash }
        else
          render json: { errors: company.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        company = current_account.companies.find(params[:id])
        authorize company
        company.destroy
        head :no_content
      end

      private

      def company_params
        params.require(:company).permit(:name, :domain, :website, :industry, :size, metadata: {})
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

