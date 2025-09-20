# frozen_string_literal: true

class EmailTemplateSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: resource.id,
      account_id: resource.account_id,
      name: resource.name,
      subject: resource.subject,
      body: resource.body,
      format: resource.format,
      category: resource.category,
      locale: resource.locale,
      variables: resource.variables,
      created_at: resource.created_at,
      updated_at: resource.updated_at
    }
  end
end

