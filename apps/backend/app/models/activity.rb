# frozen_string_literal: true

class Activity < ApplicationRecord
  TYPES = %w[email_sent email_opened email_replied call meeting note].freeze

  belongs_to :account
  belongs_to :lead
  belongs_to :campaign, optional: true

  validates :kind, inclusion: { in: TYPES }
  validates :happened_at, presence: true
end

