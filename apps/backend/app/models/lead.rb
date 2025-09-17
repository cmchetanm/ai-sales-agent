# frozen_string_literal: true

class Lead < ApplicationRecord
  STATUSES = %w[new researching enriched outreach scheduled responded won lost archived].freeze

  belongs_to :account
  belongs_to :pipeline
  has_many :email_messages, dependent: :destroy
  has_many :follow_ups, dependent: :destroy

  validates :status, inclusion: { in: STATUSES }
  validates :email, allow_blank: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :email, uniqueness: { scope: :account_id, case_sensitive: false }, allow_blank: true
end
