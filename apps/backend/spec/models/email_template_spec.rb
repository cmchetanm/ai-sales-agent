# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EmailTemplate, type: :model do
  subject(:template) { described_class.new(account: create(:account), name: 'Intro', subject: 'Hello', body: '<p>Hi</p>', format: 'html', category: 'outreach') }

  it { is_expected.to belong_to(:account) }
  it 'validates basics' do
    expect(template).to be_valid
    template.name = nil
    expect(template).not_to be_valid
  end
end

