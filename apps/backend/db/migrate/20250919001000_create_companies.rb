class CreateCompanies < ActiveRecord::Migration[7.1]
  def change
    create_table :companies do |t|
      t.references :account, null: false, foreign_key: true
      t.string :name, null: false
      t.string :domain
      t.string :website
      t.string :industry
      t.string :size
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :companies, [:account_id, :domain], unique: true
    add_index :companies, :industry
  end
end

