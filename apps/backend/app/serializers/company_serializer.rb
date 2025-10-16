# frozen_string_literal: true

class CompanySerializer < ApplicationSerializer
  def serializable_hash
    {
      id: resource.id,
      account_id: resource.account_id,
      name: resource.name,
      domain: resource.domain,
      website: resource.website,
      industry: resource.industry,
      size: resource.size,
      metadata: resource.metadata,
      contacts_count: resource.contacts.count,
      deals_count: resource.deals.count,
      created_at: resource.created_at,
      updated_at: resource.updated_at
    }
  end
end

