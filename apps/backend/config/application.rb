require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_view/railtie"
require "action_cable/engine"

Bundler.require(*Rails.groups)

module Backend
  class Application < Rails::Application
    config.load_defaults 7.1

    config.autoload_lib(ignore: %w[assets tasks])
    config.api_only = true
    config.time_zone = "UTC"
    config.active_record.default_timezone = :utc
    config.active_record.schema_format = :sql
    config.active_job.queue_adapter = :sidekiq
    config.active_record.dump_schema_after_migration = false

    config.generators do |g|
      g.test_framework :rspec
      g.fixture_replacement :factory_bot, dir: "spec/factories"
      g.helper false
      g.assets false
      g.view_specs false
    end
  end
end
