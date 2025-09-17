# frozen_string_literal: true

require 'rails_helper'

RSpec.describe User, type: :model do
subject(:user) { create(:user) }

it { is_expected.to belong_to(:account) }
it { is_expected.to define_enum_for(:role).with_values(owner: 'owner', admin: 'admin', contributor: 'contributor', viewer: 'viewer').backed_by_column_of_type(:string) }

it { is_expected.to validate_presence_of(:email) }
it { is_expected.to validate_presence_of(:role) }
describe 'email uniqueness' do
  it 'disallows duplicates within the same account' do
    existing = create(:user, email: 'owner@example.com')
    duplicate = build(:user, account: existing.account, email: 'OWNER@example.com')

    expect(duplicate).not_to be_valid
  end

  it 'allows reuse across accounts' do
    create(:user, email: 'owner@example.com')
    other_account = create(:account)
    user = build(:user, account: other_account, email: 'owner@example.com')

    expect(user).to be_valid
  end
end

  describe '#display_name' do
    it 'prefers full name when available' do
      user.update!(first_name: 'Jane', last_name: 'Doe')

      expect(user.display_name).to eq('Jane Doe')
    end

    it 'falls back to email' do
      user.update!(first_name: nil, last_name: nil)

      expect(user.display_name).to eq(user.email)
    end
  end

  describe '#active_for_authentication?' do
    it 'returns false when marked inactive' do
      user.update!(active: false)
      expect(user.active_for_authentication?).to be false
    end
  end
end
