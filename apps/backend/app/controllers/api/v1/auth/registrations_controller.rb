# frozen_string_literal: true

module Api
  module V1
    module Auth
      class RegistrationsController < Devise::RegistrationsController
        respond_to :json
        before_action :configure_sign_up_params, only: [:create]

        def create
          plan = resolve_plan
          account = Account.new(name: account_params[:name], plan:, plan_assigned_at: Time.current)

          jwt_token = nil

          ActiveRecord::Base.transaction do
            account.save!
            build_resource(sign_up_params.merge(account:, role: 'owner'))
            resource.save!
            jwt_token = Warden::JWTAuth::UserEncoder.new.call(resource, :user, nil).first
          end

          render json: {
            account: {
              id: account.id,
              name: account.name,
              plan: account.plan.slug
            },
            user: UserSerializer.new(resource).serializable_hash,
            token: jwt_token
          }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        rescue ActiveRecord::RecordNotFound => e
          render json: { errors: [e.message] }, status: :unprocessable_entity
        end

        protected

        def configure_sign_up_params
          devise_parameter_sanitizer.permit(:sign_up, keys: %i[first_name last_name title timezone password password_confirmation email])
        end

        def sign_up(_resource_name, _resource)
          # handled explicitly to control rendering
        end

        private

        def account_params
          params.require(:account).permit(:name, :plan_slug)
        end

        def resolve_plan
          slug = account_params[:plan_slug]
          if slug.present?
            plan = Plan.active.find_by(slug:)
            return plan if plan

            raise ActiveRecord::RecordNotFound, 'Plan not provisioned'
          end

          Plan.active.first || Plan.first || raise(ActiveRecord::RecordNotFound, 'Plan not provisioned')
        end
      end
    end
  end
end
