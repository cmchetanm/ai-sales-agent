# frozen_string_literal: true

module Api
  module V1
    class DealsController < Api::BaseController
      def index
        scope = policy_scope(current_account.deals)
        scope = scope.where(company_id: params[:company_id]) if params[:company_id].present?
        scope = scope.where(contact_id: params[:contact_id]) if params[:contact_id].present?
        scope = scope.where(stage: params[:stage]) if params[:stage].present?
        if params[:q].present?
          q = "%#{params[:q].to_s.downcase}%"
          scope = scope.where('LOWER(name) LIKE :q', q:)
        end
        @pagy, records = pagy(scope.order(updated_at: :desc), items: per_page)
        render json: { deals: records.map { |d| DealSerializer.new(d).serializable_hash }, pagination: pagy_meta(@pagy) }
      end

      def show
        deal = current_account.deals.find(params[:id])
        authorize deal
        render json: { deal: DealSerializer.new(deal).serializable_hash }
      end

      def create
        deal = current_account.deals.new(deal_params)
        authorize deal
        if deal.save
          render json: { deal: DealSerializer.new(deal).serializable_hash }, status: :created
        else
          render json: { errors: deal.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        deal = current_account.deals.find(params[:id])
        authorize deal
        if deal.update(deal_params)
          render json: { deal: DealSerializer.new(deal).serializable_hash }
        else
          render json: { errors: deal.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        deal = current_account.deals.find(params[:id])
        authorize deal
        deal.destroy
        head :no_content
      end

      private
      def deal_params
        params.require(:deal).permit(:company_id, :contact_id, :owner_id, :name, :amount_cents, :currency, :stage, :probability, :close_date, metadata: {})
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
