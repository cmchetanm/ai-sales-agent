# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Pipeline, type: :model do
  it 'ensures only one primary per account' do
    account = create(:account)
    p1 = create(:pipeline, account: account, primary: true)
    p2 = create(:pipeline, account: account, primary: false)
    p2.update!(primary: true)
    expect(p2.reload.primary).to eq(true)
    expect(p1.reload.primary).to eq(false)
  end
end

