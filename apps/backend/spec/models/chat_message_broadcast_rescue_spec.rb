# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ChatMessage, type: :model do
  it 'rescues errors during broadcast' do
    sess = create(:chat_session)
    msg = described_class.new(chat_session: sess, sender_type: 'Assistant', content: 'hi', sent_at: Time.current)
    server = instance_double(ActionCable::Server::Base)
    allow(ActionCable).to receive(:server).and_return(server)
    allow(server).to receive(:broadcast).and_raise(StandardError.new('boom'))
    expect { msg.save! }.not_to raise_error
  end
end

