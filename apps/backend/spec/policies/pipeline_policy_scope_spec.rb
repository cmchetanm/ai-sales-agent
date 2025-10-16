# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PipelinePolicy::Scope do
  it 'scopes to user account' do
    a1 = create(:account)
    a2 = create(:account)
    u1 = create(:user, account: a1)
    p1 = create(:pipeline, account: a1)
    p2 = create(:pipeline, account: a2)
    scope = described_class.new(u1, Pipeline.all).resolve
    expect(scope).to include(p1)
    expect(scope).not_to include(p2)
  end
end

