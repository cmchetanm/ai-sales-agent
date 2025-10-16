# frozen_string_literal: true

class ContactSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: resource.id,
      account_id: resource.account_id,
      company_id: resource.company_id,
      first_name: resource.first_name,
      last_name: resource.last_name,
      email: resource.email,
      phone: resource.phone,
      title: resource.title,
      created_at: resource.created_at
    }
  end
end

