Rails.application.routes.draw do
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

      namespace :auth do
        resource :profile, only: [:show]
      end
    end
  end

  root to: 'api/v1/health#show'
end
