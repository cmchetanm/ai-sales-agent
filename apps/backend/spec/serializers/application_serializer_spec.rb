# frozen_string_literal: true

require 'rails_helper'

class DummySerializer < ApplicationSerializer
  def serializable_hash
    { ok: true }
  end
end

RSpec.describe ApplicationSerializer do
  it 'as_json proxies to serializable_hash' do
    s = DummySerializer.new(Object.new)
    expect(s.as_json).to eq({ ok: true })
  end

  it 'raises on base serializable_hash' do
    base = ApplicationSerializer.new(Object.new)
    expect { base.serializable_hash }.to raise_error(NotImplementedError)
  end
end

