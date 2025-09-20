# frozen_string_literal: true

class PipelineSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: resource.id,
      name: resource.name,
      description: resource.description,
      status: resource.status,
      stage_definitions: resource.stage_definitions,
      primary: resource.primary,
      stage_stats: resource.stage_stats,
      status_counts: resource.status_counts,
      created_at: resource.created_at,
      updated_at: resource.updated_at
    }
  end
end
