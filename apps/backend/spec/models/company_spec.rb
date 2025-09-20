# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Company, type: :model do
  subject(:company) { described_class.new(account: create(:account), name: 'Acme', domain: 'acme.com') }

  it { is_expected.to belong_to(:account) }
  it { is_expected.to have_many(:leads).dependent(:nullify) }

  it 'validates domain uniqueness per account' do
    expect(company).to be_valid
    company.save!
    dup = described_class.new(account: company.account, name: 'Acme 2', domain: 'acme.com')
    expect(dup).not_to be_valid
  end
end

