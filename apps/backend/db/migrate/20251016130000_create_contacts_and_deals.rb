class CreateContactsAndDeals < ActiveRecord::Migration[7.1]
  def change
    create_table :contacts do |t|
      t.references :account, null: false, foreign_key: true
      t.references :company, null: true, foreign_key: true
      t.string :first_name
      t.string :last_name
      t.string :email
      t.string :phone
      t.string :title
      t.timestamps
    end
    add_index :contacts, [:account_id, :email]

    create_table :deals do |t|
      t.references :account, null: false, foreign_key: true
      t.references :company, null: true, foreign_key: true
      t.references :contact, null: true, foreign_key: true
      t.references :owner, null: true, foreign_key: { to_table: :users }
      t.string :name, null: false
      t.integer :amount_cents, null: false, default: 0
      t.string :currency, null: false, default: 'USD'
      t.string :stage, null: false, default: 'qualification'
      t.integer :probability, null: false, default: 0
      t.date :close_date
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :deals, [:account_id, :stage]
    add_index :deals, :close_date
  end
end

