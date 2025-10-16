# frozen_string_literal: true

class ActivitySerializer < ApplicationSerializer
  def serializable_hash
    {
      id: resource.id,
      account_id: resource.account_id,
      lead_id: resource.lead_id,
      contact_id: resource.contact_id,
      deal_id: resource.deal_id,
      campaign_id: resource.campaign_id,
      kind: resource.kind,
      content: resource.content,
      metadata: resource.metadata,
      happened_at: resource.happened_at,
      created_at: resource.created_at,
      contact: (resource.contact && {
        id: resource.contact.id,
        email: resource.contact.email,
        first_name: resource.contact.first_name,
        last_name: resource.contact.last_name
      }),
      deal: (resource.deal && {
        id: resource.deal.id,
        name: resource.deal.name
      })
    }
  end
end
