# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Contact, type: :model do
  it 'display_name prefers full name then email' do
    account = create(:account)
    c1 = account.contacts.create!(email: 'x@y.com')
    expect(c1.display_name).to eq('x@y.com')
    c1.update!(first_name: 'Ava', last_name: 'Lee')
    expect(c1.display_name).to eq('Ava Lee')
  end
end

