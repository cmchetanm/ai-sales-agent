# frozen_string_literal: true

class Pipeline < ApplicationRecord
  belongs_to :account
  has_many :leads, dependent: :destroy
  has_many :campaigns, dependent: :nullify

  validates :name, presence: true, uniqueness: { scope: :account_id }
  validates :status, inclusion: { in: %w[active archived] }
end
