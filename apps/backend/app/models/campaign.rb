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
end
