# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API V1 Internal Tools metrics', type: :request do
  let!(:account) { create(:account) }
  let(:token) { 'tok' }

  before do
    allow(ENV).to receive(:fetch).with('INTERNAL_API_TOKEN', nil).and_return(token)
  end

  it 'updates campaign metrics and variant counts on events' do
    pipe = create(:pipeline, account: account)
    campaign = create(:campaign, account: account, pipeline: pipe, channel: 'email', status: 'running')
    lead = create(:lead, account: account, pipeline: pipe)
    msg = account.email_messages.create!(campaign: campaign, lead: lead, status: 'delivered', direction: 'outbound', subject: 'x', body_text: 'y', metadata: { 'variant' => 'A' }, sent_at: Time.current)

    %w[clicked opened].each do |status|
      post '/api/v1/internal/email_event', headers: { 'X-Internal-Token' => token }, params: { message_id: msg.id, status: status }
      expect(response).to have_http_status(:ok)
    end

    metrics = campaign.reload.metrics
    expect(metrics['events']['clicked']).to be >= 1
    expect(metrics['events']['opened']).to be >= 1
    expect(metrics.dig('variants', 'A', 'clicked')).to be >= 1
  end
end
