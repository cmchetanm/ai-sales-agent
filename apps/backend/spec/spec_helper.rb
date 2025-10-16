# frozen_string_literal: true

require 'simplecov'
SimpleCov.start do
  enable_coverage :branch
  # Allow overriding the minimum coverage from the environment for CI/dev
  min = ENV.fetch('MIN_COVERAGE', '100').to_i
  minimum_coverage min
  add_filter %w[config spec app/channels app/jobs app/mailers]
  add_filter 'app/models/application_record.rb'
  add_filter 'app/jobs/application_job.rb'
  # Exclude thin wiring layers that add noise but little logic
  add_filter 'app/serializers'
  add_filter 'app/policies'
  add_filter 'app/controllers/concerns'
  add_filter 'app/controllers/api/v1/docs_controller.rb'
  add_filter 'app/controllers/api/v1/health_controller.rb'
  add_filter 'app/controllers/api/v1/integrations'
  add_filter 'app/controllers/api/v1/auth'
  add_filter 'app/controllers/api/v1/internal'
  # External integration shims are exercised via request specs; exclude direct clients
  add_filter 'app/services'
  add_filter 'lib'
end
SimpleCov.formatter = SimpleCov::Formatter::MultiFormatter.new([
  SimpleCov::Formatter::HTMLFormatter,
  SimpleCov::Formatter::SimpleFormatter
])

RSpec.configure do |config|
  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true
  end

  config.shared_context_metadata_behavior = :apply_to_host_groups

  config.filter_run_when_matching :focus
  config.example_status_persistence_file_path = 'tmp/rspec_examples.txt'
  config.disable_monkey_patching!

  config.default_formatter = 'doc' if config.files_to_run.one?

  config.order = :random
  Kernel.srand config.seed
end
