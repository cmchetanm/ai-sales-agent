# frozen_string_literal: true

class EmailTemplate < ApplicationRecord
  FORMATS = %w[html text].freeze
  CATEGORIES = %w[outreach follow_up transactional].freeze

  belongs_to :account

  validates :name, presence: true, length: { maximum: 120 }
  validates :subject, presence: true
  validates :body, presence: true
  validates :format, inclusion: { in: FORMATS }
  validates :category, inclusion: { in: CATEGORIES }
  validates :name, uniqueness: { scope: :account_id, case_sensitive: false }
end

