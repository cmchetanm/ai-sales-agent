# frozen_string_literal: true

class Deal < ApplicationRecord
  STAGES = %w[qualification discovery proposal negotiation won lost].freeze

  belongs_to :account
  belongs_to :company, optional: true
  belongs_to :contact, optional: true
  belongs_to :owner, class_name: 'User', optional: true

  validates :name, presence: true
  validates :stage, inclusion: { in: STAGES }
  validates :amount_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :probability, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
end

