Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check
  get "/health", to: proc { [200, { "Content-Type" => "application/json" }, [{ status: "ok" }.to_json]] }

  namespace :api do
    namespace :v1 do
      resource :health, only: [:show], controller: :health
    end
  end

  root to: "api/v1/health#show"
end
