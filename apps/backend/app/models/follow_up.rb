# frozen_string_literal: true

class FollowUp < ApplicationRecord
  CHANNELS = %w[email call meeting sms].freeze
  STATUSES = %w[scheduled in_progress completed cancelled failed].freeze

  belongs_to :account
  belongs_to :campaign, optional: true
  belongs_to :lead

  validates :channel, inclusion: { in: CHANNELS }
  validates :status, inclusion: { in: STATUSES }
  validates :execute_at, presence: true
end
