# frozen_string_literal: true

class Pipeline < ApplicationRecord
  belongs_to :account
  has_many :leads, dependent: :destroy
  has_many :campaigns, dependent: :nullify

  validates :name, presence: true, uniqueness: { scope: :account_id }
  validates :status, inclusion: { in: %w[active archived] }

  before_save :ensure_single_primary

  def stage_stats
    stages = Array(stage_definitions).map { |s| s.is_a?(Hash) ? s['name'] : s }.compact
    stats = stages.each_with_index.map do |name, idx|
      norm = name.to_s.strip.downcase
      count = leads.where(status: norm).count
      { name:, position: idx, count: }
    end
    stats
  end

  def status_counts
    Lead::STATUSES.index_with { |st| leads.where(status: st).count }
  end

  private

  def ensure_single_primary
    return true unless primary_changed? && primary?
    account.pipelines.where.not(id: id).update_all(primary: false)
    true
  end
end
