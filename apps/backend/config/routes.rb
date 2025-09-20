Rails.application.routes.draw do
  require 'sidekiq/web'
  begin
    require 'rack/session'
  rescue LoadError
    begin
      require 'rack/session/cookie'
    rescue LoadError
    end
  end

  # Sidekiq Web UI (admin-only via HTTP Basic)
  Sidekiq::Web.use Rack::Session::Cookie, secret: Rails.application.secret_key_base
  Sidekiq::Web.use Rack::Auth::Basic do |username, password|
    secure_compare = ->(a, b) { ActiveSupport::SecurityUtils.secure_compare(::Digest::SHA256.hexdigest(a.to_s), ::Digest::SHA256.hexdigest(b.to_s)) }
    secure_compare.call(username, ENV.fetch('SIDEKIQ_WEB_USERNAME', 'admin')) &
      secure_compare.call(password, ENV.fetch('SIDEKIQ_WEB_PASSWORD', 'admin'))
  end

  scope '(:locale)', locale: /#{I18n.available_locales.join('|')}/ do
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

    namespace :api do
      namespace :v1 do
        resource :health, only: [:show], controller: :health
        resources :plans, only: [:index]
        resources :pipelines
        resources :leads do
          collection do
            post :import
            patch :bulk_update
          end
        end
        resources :campaigns
        resources :chat_sessions, only: %i[create show] do
          resources :messages, only: %i[index create], controller: 'chat_messages'
        end

        namespace :integrations do
          resource :apollo, only: :create
          resource :discover, only: :create
        end
        post 'integrations/apollo', to: 'integrations/apollo#create'
        post 'integrations/discover', to: 'integrations/discover#create'
        namespace :internal do
          post 'profile_update', to: 'tools#profile_update'
          post 'apollo_fetch', to: 'tools#apollo_fetch'
        end
        resource :account, only: %i[show update]

        namespace :auth do
          resource :profile, only: [:show]
        end

        # API docs
        get '/openapi.yaml', to: 'docs#openapi'
        get '/api-docs', to: 'docs#ui'
      end
    end
  end

  get 'up' => 'rails/health#show', as: :rails_health_check
  get '/health', to: proc { [200, { 'Content-Type' => 'application/json' }, [{ status: 'ok' }.to_json]] }

  # Non-localized API routes remain available (compatibility)
  namespace :api do
    namespace :v1 do
      resource :health, only: [:show], controller: :health
      resources :plans, only: [:index]
      resources :pipelines
      resources :leads do
        collection do
          post :import
          patch :bulk_update
        end
      end
      resources :leads do
        resources :activities, only: [:index, :create]
        collection do
          post :import
          patch :bulk_update
        end
      end
      resources :email_templates
      resources :campaigns
      resources :chat_sessions, only: %i[create show] do
        resources :messages, only: %i[index create], controller: 'chat_messages'
      end
      namespace :integrations do
        resource :apollo, only: :create
        resource :discover, only: :create
      end
      post 'integrations/apollo', to: 'integrations/apollo#create'
      post 'integrations/discover', to: 'integrations/discover#create'
      namespace :internal do
        post 'profile_update', to: 'tools#profile_update'
        post 'apollo_fetch', to: 'tools#apollo_fetch'
        post 'discover_leads', to: 'tools#discover_leads'
      end
      resource :account, only: %i[show update]
      namespace :auth do
        resource :profile, only: [:show]
      end
      get '/openapi.yaml', to: 'docs#openapi'
      get '/api-docs', to: 'docs#ui'
    end
  end

  # Optional: redirect non-localized /api/* to /:locale/api/* preserving method/body (307)
  if ENV.fetch('API_LOCALE_REDIRECT_ENABLED', 'false').to_s.casecmp('true').zero?
    match '/api/*path', to: redirect(status: 307) { |params, req|
      accept = req.env['HTTP_ACCEPT_LANGUAGE'].to_s
      candidate = accept.split(',').map { |l| l.split(';').first }.find { |c| I18n.available_locales.include?(c.to_sym) }
      locale = (candidate || I18n.default_locale).to_s
      "/#{locale}/api/#{params[:path]}"
    }, via: :all, constraints: lambda { |req|
      req.path !~ %r{\A/(#{I18n.available_locales.join('|')})/}
    }
  end

  mount Sidekiq::Web => '/sidekiq'

  root to: 'api/v1/health#show'

  # Explicit route for test environment safety
  post '/api/v1/integrations/apollo', to: 'api/v1/integrations/apollo#create'
  post '/api/v1/integrations/discover', to: 'api/v1/integrations/discover#create'
end
