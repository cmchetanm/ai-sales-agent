# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Pipeline, type: :model do
subject(:pipeline) { create(:pipeline) }

  it { is_expected.to belong_to(:account) }
  it { is_expected.to have_many(:leads).dependent(:destroy) }
  it { is_expected.to have_many(:campaigns).dependent(:nullify) }
  it { is_expected.to validate_presence_of(:name) }
  it { is_expected.to validate_uniqueness_of(:name).scoped_to(:account_id) }
  it { is_expected.to validate_inclusion_of(:status).in_array(%w[active archived]) }
end
