# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ApplicationPolicy do
  let(:account) { create(:account) }
  let(:owner) { create(:user, account: account, role: 'owner') }
  let(:admin) { create(:user, account: account, role: 'admin') }
  let(:viewer) { create(:user, account: account, role: 'viewer') }

  class Dummy < ApplicationRecord; self.abstract_class = true; end

  it 'allows owner/admin to manage' do
    p = described_class.new(owner, Object.new)
    expect(p.create?).to eq(true)
    expect(p.update?).to eq(true)
    expect(p.destroy?).to eq(true)

    p2 = described_class.new(admin, Object.new)
    expect(p2.create?).to eq(true)
  end

  it 'disallows viewer from managing' do
    p = described_class.new(viewer, Object.new)
    expect(p.create?).to eq(false)
    expect(p.update?).to eq(false)
    expect(p.destroy?).to eq(false)
  end
end

