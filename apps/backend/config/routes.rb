Rails.application.routes.draw do
  require 'sidekiq/web'

  # Sidekiq Web UI (admin-only via HTTP Basic)
  Sidekiq::Web.use Rack::Session::Cookie, secret: Rails.application.secret_key_base
  Sidekiq::Web.use Rack::Auth::Basic do |username, password|
    secure_compare = ->(a, b) { ActiveSupport::SecurityUtils.secure_compare(::Digest::SHA256.hexdigest(a.to_s), ::Digest::SHA256.hexdigest(b.to_s)) }
    secure_compare.call(username, ENV.fetch('SIDEKIQ_WEB_USERNAME', 'admin')) &
      secure_compare.call(password, ENV.fetch('SIDEKIQ_WEB_PASSWORD', 'admin'))
  end

  devise_for :users,
             defaults: { format: :json },
             path: 'api/v1/auth',
             path_names: {
               sign_in: 'sign_in',
               sign_out: 'sign_out',
               registration: 'sign_up'
             },
             controllers: {
               sessions: 'api/v1/auth/sessions',
               registrations: 'api/v1/auth/registrations'
             }

  devise_scope :user do
    delete 'api/v1/auth/sign_out', to: 'api/v1/auth/sessions#destroy'
  end

  get 'up' => 'rails/health#show', as: :rails_health_check
  get '/health', to: proc { [200, { 'Content-Type' => 'application/json' }, [{ status: 'ok' }.to_json]] }

  namespace :api do
    namespace :v1 do
      resource :health, only: [:show], controller: :health
      resources :plans, only: [:index]
      resources :pipelines
      resources :leads
      resources :campaigns
      resource :account, only: %i[show update]

      namespace :auth do
        resource :profile, only: [:show]
      end

      # API docs
      get '/openapi.yaml', to: 'docs#openapi'
      get '/api-docs', to: 'docs#ui'
    end
  end

  mount Sidekiq::Web => '/sidekiq'

  root to: 'api/v1/health#show'
end
