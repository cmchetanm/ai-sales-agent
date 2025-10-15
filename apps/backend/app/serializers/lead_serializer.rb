# frozen_string_literal: true

class LeadSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: resource.id,
      pipeline_id: resource.pipeline_id,
      account_id: resource.account_id,
      source: resource.source,
      external_id: resource.external_id,
      status: resource.status,
      first_name: resource.first_name,
      last_name: resource.last_name,
      email: resource.email,
      company: resource.company,
      job_title: resource.job_title,
      location: resource.location,
      locked: resource.locked,
      verification_status: resource.verification_status,
      tags: resource.tags,
      phone: resource.phone,
      linkedin_url: resource.linkedin_url,
      website: resource.website,
      assigned_user_id: resource.assigned_user_id,
      assigned_user: resource.assigned_user&.slice(:id, :email, :first_name, :last_name),
      do_not_contact: resource.do_not_contact,
      email_opt_out_at: resource.email_opt_out_at,
      score: resource.score,
      score_band: score_band,
      last_contacted_at: resource.last_contacted_at,
      enrichment: resource.enrichment,
      attribution: resource.attribution,
      created_at: resource.created_at,
      updated_at: resource.updated_at
    }
  end

  private

  def score_band
    s = resource.score.to_i
    return 'hot' if s >= 75
    return 'warm' if s >= 40
    'cold'
  end
end
