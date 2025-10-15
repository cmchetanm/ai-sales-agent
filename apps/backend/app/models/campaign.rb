# frozen_string_literal: true

class Campaign < ApplicationRecord
  CHANNELS = %w[email sequence call sms].freeze
  STATUSES = %w[draft scheduled running paused completed archived].freeze

  belongs_to :account
  belongs_to :pipeline, optional: true
  has_many :email_messages, dependent: :destroy
  has_many :follow_ups, dependent: :destroy

  validates :name, presence: true, uniqueness: { scope: :account_id }
  validates :channel, inclusion: { in: CHANNELS }
  validates :status, inclusion: { in: STATUSES }

  # Accessor for sequence JSONB (for older records without column in test schema)
  def sequence
    self[:sequence] || []
  end

  # Build target leads scope from audience_filters and pipeline
  def target_scope
    scope = account.leads
    scope = scope.where(pipeline_id:) if pipeline_id.present?
    f = audience_filters || {}
    if f['status'].present?
      scope = scope.where(status: Array(f['status']))
    end
    if f['assigned_user_id'].present?
      scope = scope.where(assigned_user_id: f['assigned_user_id'])
    end
    if f['industries'].present?
      inds = Array(f['industries']).map { |x| x.to_s.downcase }
      scope = scope.where("LOWER((enrichment->>'industry')) IN (?)", inds)
    end
    if f['roles'].present?
      roles = Array(f['roles']).map { |x| "%#{x.to_s.downcase}%" }
      scope = scope.where('LOWER(job_title) LIKE ANY (ARRAY[?])', roles)
    end
    if f['locations'].present?
      locs = Array(f['locations']).map { |x| "%#{x.to_s.downcase}%" }
      scope = scope.where('LOWER(location) LIKE ANY (ARRAY[?])', locs)
    end
    if f['q'].present?
      q = "%#{f['q'].to_s.downcase}%"
      scope = scope.where('LOWER(email) LIKE :q OR LOWER(company) LIKE :q OR LOWER(first_name) LIKE :q OR LOWER(last_name) LIKE :q', q:)
    end
    scope = scope.where(do_not_contact: false)
    # Exclude locked emails by default per product decision
    scope = scope.where(locked: false)
    scope = scope.where.not(email: [nil, ''])
    scope
  end
end
