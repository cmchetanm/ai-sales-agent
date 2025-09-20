# frozen_string_literal: true

class LeadImportJob < ApplicationJob
  queue_as :default

  def perform(account_id:, csv:, pipeline_id: nil, assigned_user_id: nil)
    account = Account.find(account_id)
    pipeline = pipeline_id.present? ? account.pipelines.find_by(id: pipeline_id) : account.pipelines.first
    owner = assigned_user_id.present? ? account.users.find_by(id: assigned_user_id) : nil

    rows = CSV.parse(csv, headers: true)
    rows.each do |row|
      attrs = map_row(row)
      email = attrs[:email].to_s.strip.downcase
      external_id = attrs[:external_id].to_s.strip
      next if email.blank? && external_id.blank?

      lead = if email.present?
               account.leads.where(email: email).first_or_initialize
             else
               account.leads.where(external_id: external_id).first_or_initialize
             end
      lead.pipeline ||= pipeline
      lead.assigned_user ||= owner if owner
      lead.assign_attributes(attrs.compact)
      lead.save!
    end
  end

  private

  COLUMN_MAP = {
    'email' => :email,
    'first_name' => :first_name,
    'last_name' => :last_name,
    'company' => :company,
    'job_title' => :job_title,
    'title' => :job_title,
    'location' => :location,
    'phone' => :phone,
    'linkedin' => :linkedin_url,
    'linkedin_url' => :linkedin_url,
    'website' => :website,
    'status' => :status,
    'external_id' => :external_id
  }.freeze

  def map_row(row)
    out = {}
    row.to_h.each do |k, v|
      next if k.nil?
      key = COLUMN_MAP[k.to_s.strip.downcase]
      out[key] = v if key
    end
    out
  end
end

