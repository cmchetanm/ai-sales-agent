# frozen_string_literal: true

module Api
  module V1
    class DashboardController < Api::BaseController
      def show
        a = current_account

        # Lead totals
        total_leads   = a.leads.count
        locked_leads  = a.leads.where(locked: true).count
        unlocked_leads = total_leads - locked_leads

        # Groupings
        by_status = a.leads.group(:status).count
        by_source = a.leads.group(:source).count

        # Score histogram buckets
        # 0-20, 21-40, 41-60, 61-80, 81-100
        score_buckets = {
          '0-20' => 0,
          '21-40' => 0,
          '41-60' => 0,
          '61-80' => 0,
          '81-100' => 0
        }
        a.leads.where.not(score: nil).pluck(:score).each do |s|
          case s.to_i
          when 0..20 then score_buckets['0-20'] += 1
          when 21..40 then score_buckets['21-40'] += 1
          when 41..60 then score_buckets['41-60'] += 1
          when 61..80 then score_buckets['61-80'] += 1
          else score_buckets['81-100'] += 1
          end
        end

        # Weekly created (last 8 weeks)
        weeks_back = 8
        from_ts = weeks_back.weeks.ago.beginning_of_week
        weekly_rows = a.leads.where('created_at >= ?', from_ts)
                         .group("date_trunc('week', created_at)")
                         .order(Arel.sql("date_trunc('week', created_at)"))
                         .count
        weekly_created = weekly_rows.map { |(wk, cnt)| { week: wk.to_date.iso8601, count: cnt } }

        # Campaign overview
        campaigns_by_status = a.campaigns.group(:status).count
        email_events = a.email_messages.group(:status).count

        render json: {
          leads: {
            total: total_leads,
            unlocked: unlocked_leads,
            locked: locked_leads,
            by_status: by_status,
            by_source: by_source,
            score_histogram: score_buckets,
            weekly_created: weekly_created
          },
          campaigns: {
            by_status: campaigns_by_status,
            email_events: email_events
          }
        }
      end
    end
  end
end

