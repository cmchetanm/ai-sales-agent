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
    steps = Array(campaign.sequence.presence || default_sequence)
    now = Time.current
    campaign.target_scope.find_each do |lead|
      steps.each_with_index do |step, idx|
        channel = (step['channel'] || 'email').to_s
        delay_minutes = (step['delay_minutes'] || (idx.zero? ? 0 : 1440)).to_i
        scheduled_at = now + delay_minutes.minutes
        case channel
        when 'email'
          variant = pick_variant(step['variants'])
          subject = (variant && variant['subject']) || default_subject(campaign, lead)
          body = (variant && variant['body']) || default_body(campaign, lead)
          msg = campaign.email_messages.create!(
            account: campaign.account,
            lead: lead,
            direction: 'outbound',
            status: 'queued',
            subject: subject,
            body_text: body,
            metadata: { source: 'campaign', step: idx + 1, variant: variant&.dig('name') }
          )
          msg.update_column(:sent_at, scheduled_at) # use sent_at as scheduled_at placeholder
        when 'linkedin', 'sms'
          # Use Activity as scheduled task placeholder for non-email channels
          campaign.account.activities.create!(
            lead: lead,
            kind: 'note',
            content: (step['content'].presence || "#{channel} touchpoint for #{campaign.name}"),
            metadata: { campaign_id: campaign.id, step: idx + 1, channel: channel, scheduled_for: scheduled_at.iso8601 },
            happened_at: scheduled_at
          )
        end
      end
    end
    campaign.update!(status: 'running') if campaign.status == 'scheduled'
  end

  def default_subject(campaign, lead)
    "#{campaign.name}: Hello #{lead.first_name || lead.email.split('@').first}"
  end

  def default_body(campaign, lead)
    "Hi #{lead.first_name || 'there'},\n\nWe'd love to connect from #{campaign.account.name}."
  end

  def default_sequence
    [
      { 'channel' => 'email', 'delay_minutes' => 0, 'variants' => [
        { 'name' => 'A', 'weight' => 50, 'subject' => 'Quick intro', 'body' => 'Hi {{first_name}}, quick question about {{company}}.' },
        { 'name' => 'B', 'weight' => 50, 'subject' => 'Thoughts on AI at {{company}}?', 'body' => 'Hi {{first_name}}, curious how you handle {{topic}}.' }
      ] },
      { 'channel' => 'email', 'delay_minutes' => 2 * 24 * 60 },
      { 'channel' => 'linkedin', 'delay_minutes' => 3 * 24 * 60 }
    ]
  end

  def pick_variant(variants)
    arr = Array(variants)
    return nil if arr.empty?
    total = arr.sum { |v| (v['weight'] || 0).to_i }
    return arr.sample if total <= 0
    r = rand(1..total)
    acc = 0
    arr.each do |v|
      acc += (v['weight'] || 0).to_i
      return v if r <= acc
    end
    arr.first
  end
end
