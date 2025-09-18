# frozen_string_literal: true

require 'spec_helper'

ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
abort('The Rails environment is running in production mode!') if Rails.env.production?

require 'rspec/rails'
require 'sidekiq/testing'
Sidekiq::Testing.inline!
require 'devise/jwt/test_helpers'
require 'webmock/rspec'

WebMock.disable_net_connect!(allow_localhost: true)

Rails.root.glob('spec/support/**/*.rb').sort.each { |file| require file }

begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  abort e.to_s.strip
end

RSpec.configure do |config|
  config.fixture_paths = [Rails.root.join('spec/fixtures')]
  config.use_transactional_fixtures = true
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!
  config.include FactoryBot::Syntax::Methods
  config.include JsonHelpers, type: :request
  config.include AuthHelpers, type: :request

  config.before(:each) { Sidekiq::Worker.clear_all }
end

Shoulda::Matchers.configure do |config|
  config.integrate do |with|
    with.test_framework :rspec
    with.library :rails
  end
end
