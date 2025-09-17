Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check
  get "/health", to: proc { [200, { "Content-Type" => "application/json" }, [{ status: "ok" }.to_json]] }

  namespace :api do
    namespace :v1 do
      get "health", to: proc { [200, { "Content-Type" => "application/json" }, [{ status: "ok" }.to_json]] }
    end
  end

  if Rails.env.development?
    mount LetterOpenerWeb::Engine, at: "/letter_opener"
  end
end
