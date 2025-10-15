# frozen_string_literal: true

class LeadPack < ApplicationRecord
  belongs_to :account
  validates :lead_ids, presence: true
end

