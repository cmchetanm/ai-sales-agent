# frozen_string_literal: true

class DealSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: resource.id,
      account_id: resource.account_id,
      company_id: resource.company_id,
      contact_id: resource.contact_id,
      owner_id: resource.owner_id,
      name: resource.name,
      amount_cents: resource.amount_cents,
      currency: resource.currency,
      stage: resource.stage,
      probability: resource.probability,
      close_date: resource.close_date,
      metadata: resource.metadata,
      created_at: resource.created_at,
      contact: (resource.contact && {
        id: resource.contact.id,
        email: resource.contact.email,
        first_name: resource.contact.first_name,
        last_name: resource.contact.last_name
      }),
      company: (resource.company && {
        id: resource.company.id,
        name: resource.company.name,
        domain: resource.company.domain
      })
    }
  end
end
