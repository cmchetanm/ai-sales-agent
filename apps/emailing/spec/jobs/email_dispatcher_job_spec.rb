# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EmailDispatcherJob, type: :job do
  it 'enqueues delivery jobs for due queued messages' do
    ActiveJob::Base.queue_adapter = :test
    # Create minimal associated account/campaign/lead rows through raw SQL to satisfy FKs or bypass with nullables
    # For this test, only presence of row matters; insert minimal related rows
    # Insert minimal related rows to satisfy NOT NULL FKs
    EmailMessage.connection.execute("INSERT INTO accounts (name, plan_id, plan_assigned_at, created_at, updated_at) VALUES ('Test', 1, NOW(), NOW(), NOW()) RETURNING id")
    acc_id = EmailMessage.connection.select_value('SELECT id FROM accounts ORDER BY id DESC LIMIT 1')
    EmailMessage.connection.execute("INSERT INTO pipelines (account_id, name, status, stage_definitions, \"primary\", created_at, updated_at) VALUES (#{acc_id}, 'P', 'active', '[]', false, NOW(), NOW()) RETURNING id")
    pipe_id = EmailMessage.connection.select_value('SELECT id FROM pipelines ORDER BY id DESC LIMIT 1')
    EmailMessage.connection.execute("INSERT INTO campaigns (account_id, pipeline_id, name, channel, status, audience_filters, schedule, metrics, created_at, updated_at) VALUES (#{acc_id}, #{pipe_id}, 'C', 'email', 'running', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, NOW(), NOW()) RETURNING id")
    camp_id = EmailMessage.connection.select_value('SELECT id FROM campaigns ORDER BY id DESC LIMIT 1')
    EmailMessage.connection.execute("INSERT INTO leads (account_id, pipeline_id, status, created_at, updated_at) VALUES (#{acc_id}, #{pipe_id}, 'new', NOW(), NOW()) RETURNING id")
    lead_id = EmailMessage.connection.select_value('SELECT id FROM leads ORDER BY id DESC LIMIT 1')
    EmailMessage.connection.execute("INSERT INTO email_messages (account_id, campaign_id, lead_id, direction, status, subject, body_text, sent_at, created_at, updated_at, metadata) VALUES (#{acc_id}, #{camp_id}, #{lead_id}, 'outbound', 'queued', 'x', 'y', NULL, NOW(), NOW(), '{}'::jsonb)")
    expect {
      described_class.perform_now
    }.to have_enqueued_job(EmailDeliveryJob)
  ensure
    ActiveJob::Base.queue_adapter = :inline
  end
end
