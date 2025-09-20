# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CampaignRunJob, type: :job do
  let!(:account) { create(:account) }
  let!(:pipeline) { create(:pipeline, account:) }
  let!(:campaign) { create(:campaign, account:, pipeline:, channel: 'email', status: 'scheduled', audience_filters: { 'status' => ['new','enriched'] }) }

  it 'creates queued email messages for target leads and skips DNC/missing email' do
    lead_ok = account.leads.create!(pipeline:, email: 'ok@example.com', status: 'new')
    lead_dnc = account.leads.create!(pipeline:, email: 'dnc@example.com', status: 'new', do_not_contact: true)
    lead_no_email = account.leads.create!(pipeline:, email: nil, status: 'enriched')

    described_class.perform_now(campaign_id: campaign.id)

    msgs = campaign.email_messages
    expect(msgs.where(lead: lead_ok)).to exist
    expect(msgs.where(lead: lead_dnc)).not_to exist
    expect(msgs.where(lead: lead_no_email)).not_to exist
  end
end

