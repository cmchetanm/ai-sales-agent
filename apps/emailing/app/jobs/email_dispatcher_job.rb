# frozen_string_literal: true

class EmailDispatcherJob < ApplicationJob
  queue_as :default

  BATCH = 50

  def perform
    due = EmailMessage.where(status: 'queued').where('sent_at IS NULL OR sent_at <= ?', Time.current).limit(BATCH)
    due.find_each { |m| EmailDeliveryJob.perform_later(message_id: m.id) }
  end
end

