# frozen_string_literal: true

class CampaignSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: resource.id,
      account_id: resource.account_id,
      pipeline_id: resource.pipeline_id,
      name: resource.name,
      channel: resource.channel,
      status: resource.status,
      audience_filters: resource.audience_filters,
      schedule: resource.schedule,
      metrics: resource.metrics,
      created_at: resource.created_at,
      updated_at: resource.updated_at
    }
  end
end
