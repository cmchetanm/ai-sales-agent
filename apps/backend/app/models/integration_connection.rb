# frozen_string_literal: true

class IntegrationConnection < ApplicationRecord
  PROVIDERS = %w[apollo linkedin_sales_navigator hubspot salesforce gmail].freeze
  STATUSES = %w[inactive connected error revoked].freeze

  belongs_to :account

  validates :provider, presence: true, inclusion: { in: PROVIDERS }, uniqueness: { scope: :account_id }
  validates :status, inclusion: { in: STATUSES }
end
