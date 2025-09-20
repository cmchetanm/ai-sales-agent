# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LeadScoreJob, type: :job do
  let!(:account) { create(:account) }
  let!(:pipeline) { create(:pipeline, account:) }

  it 'computes score based on status, messages, activities, and recency' do
    lead = account.leads.create!(pipeline:, email: 'test@example.com', company: 'Acme', status: 'responded', last_contacted_at: 2.days.ago)
    camp = account.campaigns.create!(name: 'Test', channel: 'email', status: 'running')
    account.email_messages.create!(lead:, campaign: camp, status: 'opened', subject: 'Hi', body_text: 'x', sent_at: Time.current)
    account.email_messages.create!(lead:, campaign: camp, status: 'replied', subject: 'Re', body_text: 'y', sent_at: Time.current)
    account.activities.create!(lead:, kind: 'note', content: 'Called', happened_at: Time.current)

    described_class.perform_now(lead_id: lead.id)
    expect(lead.reload.score).to be >= 70
  end
end
