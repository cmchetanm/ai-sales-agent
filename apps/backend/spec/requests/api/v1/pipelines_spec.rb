# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Pipelines', type: :request do
  let!(:plan) { create(:plan) }
  let!(:account) { create(:account, plan:) }
  let!(:user) { create(:user, account:) }

  describe 'CRUD' do
    it 'creates, shows, updates, and deletes a pipeline' do
      # create
      post '/api/v1/pipelines',
           headers: auth_headers(user),
           params: { pipeline: { name: 'New Pipeline', description: 'D', status: 'active', primary: false, stage_definitions: [{ name: 'New' }] } }

      expect(response).to have_http_status(:created)
      pid = json_body['pipeline']['id']

      # show
      get "/api/v1/pipelines/#{pid}", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(json_body['pipeline']['name']).to eq('New Pipeline')

      # update
      patch "/api/v1/pipelines/#{pid}", headers: auth_headers(user), params: { pipeline: { name: 'Updated' } }
      expect(response).to have_http_status(:ok)
      expect(json_body['pipeline']['name']).to eq('Updated')

      # delete
      delete "/api/v1/pipelines/#{pid}", headers: auth_headers(user)
      expect(response).to have_http_status(:no_content)
    end
  end
end

