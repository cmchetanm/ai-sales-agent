# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ChatSessionChannel, type: :channel do
  it 'subscribes to chat_session stream' do
    stub_connection
    subscribe(id: 123)
    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_from('chat_session:123')
  end
end
