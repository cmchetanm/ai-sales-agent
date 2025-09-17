# frozen_string_literal: true

require 'rails_helper'

RSpec.describe IntegrationConnection, type: :model do
subject(:connection) { create(:integration_connection) }

  it { is_expected.to belong_to(:account) }
  it { is_expected.to validate_inclusion_of(:provider).in_array(IntegrationConnection::PROVIDERS) }
  it { is_expected.to validate_inclusion_of(:status).in_array(IntegrationConnection::STATUSES) }
  it { is_expected.to validate_uniqueness_of(:provider).scoped_to(:account_id) }
end
