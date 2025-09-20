# frozen_string_literal: true

class ActivitySerializer < ApplicationSerializer
  def serializable_hash
    {
      id: resource.id,
      account_id: resource.account_id,
      lead_id: resource.lead_id,
      campaign_id: resource.campaign_id,
      kind: resource.kind,
      content: resource.content,
      metadata: resource.metadata,
      happened_at: resource.happened_at,
      created_at: resource.created_at
    }
  end
end

