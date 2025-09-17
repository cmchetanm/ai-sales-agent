# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ApplicationController, type: :controller do
  controller do
    def index
      authorize(Object)
      render json: { allowed: true }
    end
  end

  before do
    routes.draw { get 'anonymous' => 'anonymous#index' }
  end

  it 'renders a forbidden response when authorization fails' do
    allow(controller).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)

    get :index

    expect(response).to have_http_status(:forbidden)
    expect(JSON.parse(response.body)).to eq('error' => 'Not authorized')
  end
end
