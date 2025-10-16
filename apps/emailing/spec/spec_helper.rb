# frozen_string_literal: true

require 'simplecov'
SimpleCov.start do
  enable_coverage :branch
  min = ENV.fetch('MIN_COVERAGE', '100').to_i
  minimum_coverage min
  # Do not filter app/jobs so we accurately measure real coverage
  add_filter %w[config spec app/channels app/mailers]
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
