# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EmailDispatcherJob, type: :job do
  it 'enqueues delivery jobs for due queued messages' do
    ActiveJob::Base.queue_adapter = :test
    # Ensure a minimal email_messages table exists in test DB
    conn = ActiveRecord::Base.connection
    unless conn.table_exists?(:email_messages)
      ActiveRecord::Schema.define do
        create_table :email_messages, force: true do |t|
          t.integer :account_id
          t.integer :campaign_id
          t.integer :lead_id
          t.string  :direction
          t.string  :status, null: false
          t.string  :subject
          t.text    :body_text
          t.datetime :sent_at
          t.jsonb   :metadata, default: {}
          t.timestamps
        end
      end
    end
    # Ensure minimal parent rows exist to satisfy foreign keys
    plan_id = conn.select_value("SELECT id FROM plans WHERE slug='basic'") ||
              conn.select_value("INSERT INTO plans (name, slug, monthly_price_cents, features, limits, active, created_at, updated_at) VALUES ('Basic','basic',0,'{}','{}',true,NOW(),NOW()) RETURNING id")
    acc_id = conn.select_value("INSERT INTO accounts (name, plan_id, plan_assigned_at, active, settings, created_at, updated_at) VALUES ('Test', #{plan_id}, NOW(), true, '{}'::jsonb, NOW(), NOW()) RETURNING id")
    pipe_id = conn.select_value("INSERT INTO pipelines (account_id, name, status, stage_definitions, \"primary\", created_at, updated_at) VALUES (#{acc_id}, 'P', 'active', '[]', false, NOW(), NOW()) RETURNING id")
    camp_id = conn.select_value("INSERT INTO campaigns (account_id, pipeline_id, name, channel, status, audience_filters, schedule, metrics, created_at, updated_at) VALUES (#{acc_id}, #{pipe_id}, 'C', 'email', 'running', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, NOW(), NOW()) RETURNING id")
    lead_id = conn.select_value("INSERT INTO leads (account_id, pipeline_id, status, created_at, updated_at) VALUES (#{acc_id}, #{pipe_id}, 'new', NOW(), NOW()) RETURNING id")
    EmailMessage.create!(account_id: acc_id, campaign_id: camp_id, lead_id: lead_id, status: 'queued', direction: 'outbound', subject: 'x', body_text: 'y', metadata: {})
    expect {
      described_class.perform_now
    }.to have_enqueued_job(EmailDeliveryJob)
  ensure
    ActiveJob::Base.queue_adapter = :inline
  end
end
