# frozen_string_literal: true

class UserSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: resource.id,
      email: resource.email,
      first_name: resource.first_name,
      last_name: resource.last_name,
      role: resource.role,
      account_id: resource.account_id
    }
  end
end
