class AddUniqueIndexOnCampaignNamePerAccount < ActiveRecord::Migration[7.1]
  def change
    add_index :campaigns, [:account_id, :name], unique: true
  end
end

