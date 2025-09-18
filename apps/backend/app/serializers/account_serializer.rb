# frozen_string_literal: true

class AccountSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: resource.id,
      name: resource.name,
      active: resource.active,
      plan: PlanSerializer.new(resource.plan).serializable_hash,
      settings: resource.settings,
      profile: resource.profile&.attributes&.slice('summary', 'target_industries', 'target_roles', 'target_locations', 'ideal_customer_profile', 'questionnaire')
    }
  end
end
