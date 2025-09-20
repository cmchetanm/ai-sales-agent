# frozen_string_literal: true

class LeadScoreJob < ApplicationJob
  queue_as :default

  def perform(lead_id:)
    lead = Lead.find_by(id: lead_id)
    return unless lead

    lead.update_column(:score, compute_score(lead))
  end

  private

  def compute_score(lead)
    score = 0
    # Status-based weighting
    case lead.status
    when 'won'
      score += 80
    when 'responded'
      score += 60
    when 'scheduled'
      score += 40
    when 'outreach'
      score += 20
    when 'enriched'
      score += 10
    when 'archived', 'lost'
      score -= 20
    end

    # Signal strength from messaging and activities
    email_opened = lead.email_messages.where(status: 'opened').count
    email_replied = lead.email_messages.where(status: 'replied').count
    acts = lead.activities.count

    score += email_opened * 2
    score += email_replied * 8
    score += acts

    # Basic completeness
    score += 5 if lead.email.present?
    score += 5 if lead.company.present?

    # Last contacted recency boost (within 14 days)
    if lead.last_contacted_at.present?
      days = [(Time.current.to_date - lead.last_contacted_at.to_date).to_i, 0].max
      recency = [[14 - days, 0].max, 14].min
      score += recency
    end

    [[score, 0].max, 100].min
  end
end

