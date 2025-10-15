namespace :leads do
  desc 'Backfill lead scores for all leads'
  task score_backfill: :environment do
    scope = Lead.all
    total = scope.count
    puts "Backfilling scores for #{total} leads..."
    scope.find_each do |l|
      LeadScoreJob.perform_now(lead_id: l.id)
    end
    puts 'Done.'
  end
end

