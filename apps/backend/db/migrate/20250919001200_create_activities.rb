class CreateActivities < ActiveRecord::Migration[7.1]
  def change
    create_table :activities do |t|
      t.references :account, null: false, foreign_key: true
      t.references :lead, null: false, foreign_key: true
      t.references :campaign, foreign_key: true
      t.string :kind, null: false
      t.text :content
      t.jsonb :metadata, null: false, default: {}
      t.datetime :happened_at, null: false
      t.timestamps
    end
    add_index :activities, [:account_id, :lead_id, :kind]
    add_index :activities, :happened_at
  end
end

