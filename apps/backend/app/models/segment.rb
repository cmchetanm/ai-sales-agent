# frozen_string_literal: true

class Segment < ApplicationRecord
  belongs_to :account
  validates :name, presence: true
end

