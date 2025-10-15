# frozen_string_literal: true

module Api
  module V1
    class SegmentsController < Api::BaseController
      def index
        segments = policy_scope(current_account.segments).order(created_at: :desc)
        render json: { segments: segments.map { |s| serialize(s) } }
      end

      def create
        seg = current_account.segments.new(name: params.require(:segment).permit(:name)[:name], filters: params.require(:segment).permit!.to_h[:filters] || {})
        authorize seg
        seg.save!
        render json: { segment: serialize(seg) }, status: :created
      end

      def show
        seg = current_account.segments.find(params[:id])
        authorize seg, :show?
        render json: { segment: serialize(seg) }
      end

      def destroy
        seg = current_account.segments.find(params[:id])
        authorize seg, :destroy?
        seg.destroy
        head :no_content
      end

      private

      def serialize(s)
        { id: s.id, name: s.name, filters: s.filters, created_at: s.created_at }
      end
    end
  end
end
