class CreateLeadPacks < ActiveRecord::Migration[7.1]
  def change
    create_table :lead_packs do |t|
      t.references :account, null: false, foreign_key: true
      t.string :name
      t.jsonb :lead_ids, null: false, default: []
      t.jsonb :filters, null: false, default: {}
      t.timestamps
    end
    add_index :lead_packs, :created_at
  end
end
