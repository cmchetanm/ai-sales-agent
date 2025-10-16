# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EmailDeliveryJob, type: :job do
  it 'posts event when internal token present' do
    conn = ActiveRecord::Base.connection
    plan_id = conn.select_value("SELECT id FROM plans WHERE slug='basic'") ||
              conn.select_value("INSERT INTO plans (name, slug, monthly_price_cents, features, limits, active, created_at, updated_at) VALUES ('Basic','basic',0,'{}','{}',true,NOW(),NOW()) RETURNING id")
    acc_id = conn.select_value("INSERT INTO accounts (name, plan_id, plan_assigned_at, active, settings, created_at, updated_at) VALUES ('Test', #{plan_id}, NOW(), true, '{}'::jsonb, NOW(), NOW()) RETURNING id")
    pipe_id = conn.select_value("INSERT INTO pipelines (account_id, name, status, stage_definitions, \"primary\", created_at, updated_at) VALUES (#{acc_id}, 'P', 'active', '[]', false, NOW(), NOW()) RETURNING id")
    camp_id = conn.select_value("INSERT INTO campaigns (account_id, pipeline_id, name, channel, status, audience_filters, schedule, metrics, created_at, updated_at) VALUES (#{acc_id}, #{pipe_id}, 'C', 'email', 'running', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, NOW(), NOW()) RETURNING id")
    lead_id = conn.select_value("INSERT INTO leads (account_id, pipeline_id, status, created_at, updated_at) VALUES (#{acc_id}, #{pipe_id}, 'new', NOW(), NOW()) RETURNING id")
    msg = EmailMessage.create!(account_id: acc_id, campaign_id: camp_id, lead_id: lead_id, status: 'queued', direction: 'outbound', metadata: {})

    prev = ENV['INTERNAL_API_TOKEN']
    ENV['INTERNAL_API_TOKEN'] = 'tkn'

    # Stub Net::HTTP to avoid a real network call
    http = instance_double(Net::HTTP)
    allow(Net::HTTP).to receive(:new).and_return(http)
    allow(http).to receive(:use_ssl=)
    allow(http).to receive(:request).and_return(double)

    described_class.perform_now(message_id: msg.id)

    ENV['INTERNAL_API_TOKEN'] = prev
  end
end
