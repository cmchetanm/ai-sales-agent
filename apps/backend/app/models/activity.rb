# frozen_string_literal: true

class Activity < ApplicationRecord
  TYPES = %w[email_sent email_opened email_replied call meeting note].freeze

  belongs_to :account
  belongs_to :lead, optional: true
  belongs_to :contact, optional: true
  belongs_to :deal, optional: true
  belongs_to :campaign, optional: true

  validates :kind, inclusion: { in: TYPES }
  validates :happened_at, presence: true
  validate :has_subject

  private
  def has_subject
    if lead_id.blank? && contact_id.blank? && deal_id.blank?
      errors.add(:base, 'activity must belong to lead, contact, or deal')
    end
  end
end
