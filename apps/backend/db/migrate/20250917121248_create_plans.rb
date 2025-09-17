class CreatePlans < ActiveRecord::Migration[7.1]
  def change
    create_table :plans do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.text :description
      t.integer :monthly_price_cents, null: false, default: 0
      t.jsonb :limits, null: false, default: {}
      t.jsonb :features, null: false, default: {}
      t.boolean :active, null: false, default: true
      t.timestamps
    end

    add_index :plans, :slug, unique: true
  end
end
