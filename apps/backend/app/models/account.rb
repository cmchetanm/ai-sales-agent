# frozen_string_literal: true

class Account < ApplicationRecord
  belongs_to :plan

  has_one :profile, class_name: 'AccountProfile', dependent: :destroy
  has_many :users, dependent: :destroy
  has_many :integration_connections, dependent: :destroy
  has_many :pipelines, dependent: :destroy
  has_many :leads, dependent: :destroy
  has_many :campaigns, dependent: :destroy
  has_many :email_messages, dependent: :destroy
  has_many :follow_ups, dependent: :destroy
  has_many :chat_sessions, dependent: :destroy

  accepts_nested_attributes_for :profile

  validates :name, presence: true

  before_validation :ensure_plan_assigned_at

  def feature_enabled?(feature_key)
    plan&.feature_enabled?(feature_key)
  end

  def limit_for(feature_key)
    plan&.limit_for(feature_key)
  end

  private

  def ensure_plan_assigned_at
    self.plan_assigned_at ||= Time.current if plan.present?
  end
end
