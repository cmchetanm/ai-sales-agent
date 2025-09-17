# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Plan, type: :model do
  subject(:plan) { create(:plan, features: { 'enabled' => %w[feature_a] }, limits: { 'leads' => 5 }) }

  it { is_expected.to have_many(:accounts).dependent(:restrict_with_exception) }
  it { is_expected.to validate_presence_of(:name) }
  it { is_expected.to validate_presence_of(:slug) }
  it { is_expected.to validate_uniqueness_of(:slug) }

  describe '#feature_enabled?' do
    it 'returns true when the feature is present' do
      expect(plan.feature_enabled?(:feature_a)).to be true
    end

    it 'returns false when missing' do
      expect(plan.feature_enabled?(:feature_b)).to be false
    end
  end

  describe '#limit_for' do
    it 'returns limits stored in json' do
      expect(plan.limit_for(:leads)).to eq(5)
    end
  end
end
