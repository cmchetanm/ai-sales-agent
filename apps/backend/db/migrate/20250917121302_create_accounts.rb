class CreateAccounts < ActiveRecord::Migration[7.1]
  def change
    create_table :accounts do |t|
      t.string :name, null: false
      t.references :plan, null: false, foreign_key: true
      t.datetime :plan_assigned_at, null: false
      t.boolean :active, null: false, default: true
      t.jsonb :settings, null: false, default: {}
      t.timestamps
    end

    add_index :accounts, :name
  end
end
