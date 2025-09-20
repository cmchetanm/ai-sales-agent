# frozen_string_literal: true

class Lead < ApplicationRecord
  STATUSES = %w[new researching enriched outreach scheduled responded won lost archived].freeze

  belongs_to :account
  belongs_to :pipeline
  # Keep the legacy string column `company` for display, and optionally link to a Company record via company_id.
  belongs_to :company_record, class_name: 'Company', foreign_key: 'company_id', optional: true
  has_many :email_messages, dependent: :destroy
  has_many :follow_ups, dependent: :destroy
  has_many :activities, dependent: :destroy

  validates :status, inclusion: { in: STATUSES }
  validates :email, allow_blank: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :email, uniqueness: { scope: :account_id, case_sensitive: false }, allow_blank: true

  before_validation :normalize_fields
  after_commit :enqueue_score, on: %i[create update]

  private

  def normalize_fields
    self.email = email.to_s.strip.downcase.presence
    self.phone = phone.to_s.strip.presence
    self.website = website.to_s.strip.presence
    self.linkedin_url = linkedin_url.to_s.strip.presence
    self.first_name = first_name.to_s.strip.presence
    self.last_name = last_name.to_s.strip.presence
    self.company = company.to_s.strip.presence
  end

  def enqueue_score
    LeadScoreJob.perform_later(lead_id: id)
  end
end
