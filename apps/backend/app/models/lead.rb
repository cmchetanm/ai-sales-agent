# frozen_string_literal: true

class Lead < ApplicationRecord
  STATUSES = %w[new researching enriched outreach scheduled responded won lost archived].freeze

  belongs_to :account
  belongs_to :pipeline
  belongs_to :assigned_user, class_name: 'User', optional: true
  # Keep the legacy string column `company` for display, and optionally link to a Company record via company_id.
  belongs_to :company_record, class_name: 'Company', foreign_key: 'company_id', optional: true
  has_many :email_messages, dependent: :destroy
  has_many :follow_ups, dependent: :destroy
  has_many :activities, dependent: :destroy

  validates :status, inclusion: { in: STATUSES }
  validates :email, allow_blank: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :email, uniqueness: { scope: :account_id, case_sensitive: false }, allow_blank: true
  validate :assigned_user_must_belong_to_account

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
  rescue StandardError => e
    Rails.logger.warn("LeadScoreJob enqueue failed: #{e.class}: #{e.message}. Running inline.")
    begin
      LeadScoreJob.perform_now(lead_id: id)
    rescue StandardError => inner
      Rails.logger.error("LeadScoreJob inline failed: #{inner.class}: #{inner.message}")
    end
  end

  def assigned_user_must_belong_to_account
    return if assigned_user_id.blank?
    errors.add(:assigned_user_id, :invalid) unless assigned_user&.account_id == account_id
  end
end
