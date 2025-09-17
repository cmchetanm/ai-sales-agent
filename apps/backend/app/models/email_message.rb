# frozen_string_literal: true

class EmailMessage < ApplicationRecord
  DIRECTIONS = %w[outbound inbound].freeze
  STATUSES = %w[pending queued sent delivered opened clicked replied bounced failed].freeze

  belongs_to :account
  belongs_to :campaign
  belongs_to :lead

  validates :direction, inclusion: { in: DIRECTIONS }
  validates :status, inclusion: { in: STATUSES }
  validates :tracking_token, uniqueness: true, allow_nil: true
  validates :sent_at, presence: true, if: -> { status.in?(%w[sent delivered opened clicked replied]) }
end
