# frozen_string_literal: true

module Api
  module V1
    class EmailTemplatesController < Api::BaseController
      def index
        scope = policy_scope(current_account.email_templates).order(created_at: :desc)
        scope = scope.where(category: params[:category]) if params[:category].present?
        scope = scope.where(locale: params[:locale]) if params[:locale].present?
        @pagy, records = pagy(scope, items: per_page)
        render json: { email_templates: records.map { |t| EmailTemplateSerializer.new(t).serializable_hash }, pagination: pagy_meta(@pagy) }
      end

      def show
        template = current_account.email_templates.find(params[:id])
        authorize template
        render json: { email_template: EmailTemplateSerializer.new(template).serializable_hash }
      end

      def create
        template = current_account.email_templates.new(template_params)
        authorize template
        if template.save
          render json: { email_template: EmailTemplateSerializer.new(template).serializable_hash }, status: :created
        else
          render json: { errors: template.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        template = current_account.email_templates.find(params[:id])
        authorize template
        if template.update(template_params)
          render json: { email_template: EmailTemplateSerializer.new(template).serializable_hash }
        else
          render json: { errors: template.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        template = current_account.email_templates.find(params[:id])
        authorize template
        template.destroy
        head :no_content
      end

      private

      def per_page
        (params[:per_page].presence || Pagy::DEFAULT[:items]).to_i
      end

      def pagy_meta(p)
        { page: p.page, items: p.items, count: p.count, pages: p.pages }
      end

      def template_params
        params.require(:email_template).permit(:name, :subject, :body, :format, :category, :locale, variables: {})
      end
    end
  end
end

