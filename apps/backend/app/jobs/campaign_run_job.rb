# frozen_string_literal: true

class CampaignRunJob < ApplicationJob
  queue_as :default

  def perform(campaign_id:)
    campaign = Campaign.find_by(id: campaign_id)
    return unless campaign

    case campaign.channel
    when 'email'
      run_email(campaign)
    else
      Rails.logger.info("CampaignRunJob: Channel #{campaign.channel} not implemented")
    end
  end

  private

  def run_email(campaign)
    campaign.target_scope.find_each do |lead|
      # Avoid duplicate pending messages for this campaign+lead
      exists = campaign.email_messages.where(lead_id: lead.id).exists?
      next if exists
      campaign.email_messages.create!(
        account: campaign.account,
        lead: lead,
        direction: 'outbound',
        status: 'queued',
        subject: default_subject(campaign, lead),
        body_text: default_body(campaign, lead),
        sent_at: nil,
        metadata: { source: 'campaign_run_job' }
      )
    end
    campaign.update!(status: 'running') if campaign.status == 'scheduled'
  end

  def default_subject(campaign, lead)
    "#{campaign.name}: Hello #{lead.first_name || lead.email.split('@').first}"
  end

  def default_body(campaign, lead)
    "Hi #{lead.first_name || 'there'},\n\nWe'd love to connect from #{campaign.account.name}."
  end
end

