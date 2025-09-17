# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Account, type: :model do
  subject(:account) { build(:account, plan: create(:plan)) }

  it { is_expected.to belong_to(:plan) }
  it { is_expected.to have_one(:profile).class_name('AccountProfile').dependent(:destroy) }
  it { is_expected.to have_many(:users).dependent(:destroy) }
  it { is_expected.to have_many(:integration_connections).dependent(:destroy) }
  it { is_expected.to validate_presence_of(:name) }

  describe '#feature_enabled?' do
    it 'returns true when the plan enables the feature' do
      account.plan.update!(features: { 'enabled' => %w[some_feature] })
      expect(account.feature_enabled?(:some_feature)).to be true
    end
  end

  describe '#limit_for' do
    it 'returns the limit defined on the plan' do
      account.plan.update!(limits: { 'limit' => 10 })
      expect(account.limit_for(:limit)).to eq(10)
    end
  end

  describe 'callbacks' do
    it 'populates plan_assigned_at when missing' do
      account.plan_assigned_at = nil
      account.save!
      expect(account.plan_assigned_at).to be_present
    end
  end
end
