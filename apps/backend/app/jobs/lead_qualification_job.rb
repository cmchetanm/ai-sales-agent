# frozen_string_literal: true

class LeadQualificationJob < ApplicationJob
  queue_as :default

  def perform(lead_id:)
    lead = Lead.find_by(id: lead_id)
    return unless lead

    # Log qualification started
    lead.account.activities.create!(lead: lead, kind: 'note', content: 'Qualification bot queued', happened_at: Time.current)

    # Placeholder: Here we could call LLM/emailing service to send qualifying questions
    # For now, mark enrichment flag and keep status unchanged
    lead.update!(enrichment: (lead.enrichment || {}).merge(qualification: { queued_at: Time.current }))
  end
end

