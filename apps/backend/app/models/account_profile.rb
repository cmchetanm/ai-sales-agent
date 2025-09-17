# frozen_string_literal: true

class AccountProfile < ApplicationRecord
  belongs_to :account

  validates :account, presence: true
end
