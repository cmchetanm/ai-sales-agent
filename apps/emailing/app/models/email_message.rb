# frozen_string_literal: true

class EmailMessage < ApplicationRecord
  self.table_name = 'email_messages'

  DIRECTIONS = %w[outbound inbound].freeze
  STATUSES = %w[pending queued sent delivered opened clicked replied bounced failed cancelled].freeze

  belongs_to :campaign, optional: true
  belongs_to :lead, optional: true

  validates :direction, inclusion: { in: DIRECTIONS }, allow_nil: true
  validates :status, inclusion: { in: STATUSES }
end

