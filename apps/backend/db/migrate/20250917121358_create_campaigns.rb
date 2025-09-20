class CreateCampaigns < ActiveRecord::Migration[7.1]
  def change
    create_table :campaigns do |t|
      t.references :account, null: false, foreign_key: true
      t.references :pipeline, foreign_key: true
      t.string :name, null: false
      t.string :channel, null: false
      t.string :status, null: false, default: 'draft'
      t.jsonb :audience_filters, null: false, default: {}
      t.jsonb :sequence, null: false, default: []
      t.jsonb :schedule, null: false, default: {}
      t.jsonb :metrics, null: false, default: {}
      t.timestamps
    end

    add_index :campaigns, [:account_id, :channel]
  end
end
