class CreateFollowUps < ActiveRecord::Migration[7.1]
  def change
    create_table :follow_ups do |t|
      t.references :account, null: false, foreign_key: true
      t.references :campaign, foreign_key: true
      t.references :lead, null: false, foreign_key: true
      t.string :channel, null: false
      t.string :status, null: false, default: 'scheduled'
      t.datetime :execute_at, null: false
      t.jsonb :payload, null: false, default: {}
      t.timestamps
    end

    add_index :follow_ups, [:account_id, :status]
    add_index :follow_ups, :execute_at
  end
end
