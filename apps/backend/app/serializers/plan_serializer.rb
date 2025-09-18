# frozen_string_literal: true

class PlanSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: resource.id,
      name: resource.name,
      slug: resource.slug,
      description: resource.description,
      monthly_price_cents: resource.monthly_price_cents,
      limits: resource.limits,
      features: resource.features,
      active: resource.active
    }
  end
end
