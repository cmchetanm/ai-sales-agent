# frozen_string_literal: true

module Api
  module V1
    class ContactsController < Api::BaseController
      def index
        scope = policy_scope(current_account.contacts)
        scope = scope.where(company_id: params[:company_id]) if params[:company_id].present?
        if params[:q].present?
          q = "%#{params[:q].to_s.downcase}%"
          scope = scope.where('LOWER(email) LIKE :q OR LOWER(first_name) LIKE :q OR LOWER(last_name) LIKE :q', q:)
        end
        @pagy, records = pagy(scope.order(updated_at: :desc), items: per_page)
        render json: { contacts: records.map { |c| ContactSerializer.new(c).serializable_hash }, pagination: pagy_meta(@pagy) }
      end

      def show
        contact = current_account.contacts.find(params[:id])
        authorize contact
        render json: { contact: ContactSerializer.new(contact).serializable_hash }
      end

      def create
        contact = current_account.contacts.new(contact_params)
        authorize contact
        if contact.save
          render json: { contact: ContactSerializer.new(contact).serializable_hash }, status: :created
        else
          render json: { errors: contact.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        contact = current_account.contacts.find(params[:id])
        authorize contact
        if contact.update(contact_params)
          render json: { contact: ContactSerializer.new(contact).serializable_hash }
        else
          render json: { errors: contact.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        contact = current_account.contacts.find(params[:id])
        authorize contact
        contact.destroy
        head :no_content
      end

      private
      def contact_params
        params.require(:contact).permit(:company_id, :first_name, :last_name, :email, :phone, :title)
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
