# frozen_string_literal: true

class Plan < ApplicationRecord
  has_many :accounts, dependent: :restrict_with_exception

  validates :name, :slug, presence: true
  validates :slug, uniqueness: true

  scope :active, -> { where(active: true) }

  def feature_enabled?(key)
    Array(features['enabled']).include?(key.to_s)
  end

  def limit_for(key)
    limits[key.to_s]
  end
end
