# frozen_string_literal: true

class Company < ApplicationRecord
  belongs_to :account
  has_many :leads, dependent: :nullify

  validates :name, presence: true, length: { maximum: 255 }
  validates :domain, length: { maximum: 255 }, allow_blank: true
  validates :domain, uniqueness: { scope: :account_id, case_sensitive: false }, allow_blank: true
end

