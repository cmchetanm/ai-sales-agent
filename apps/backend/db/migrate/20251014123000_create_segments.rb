class CreateSegments < ActiveRecord::Migration[7.1]
  def change
    create_table :segments do |t|
      t.references :account, null: false, foreign_key: true
      t.string :name, null: false
      t.jsonb :filters, null: false, default: {}
      t.timestamps
    end
    add_index :segments, :created_at
  end
end
