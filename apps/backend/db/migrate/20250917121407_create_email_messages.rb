class CreateEmailMessages < ActiveRecord::Migration[7.1]
  def change
    create_table :email_messages do |t|
      t.references :account, null: false, foreign_key: true
      t.references :campaign, null: false, foreign_key: true
      t.references :lead, null: false, foreign_key: true
      t.string :direction, null: false, default: 'outbound'
      t.string :status, null: false, default: 'pending'
      t.string :subject
      t.text :body_text
      t.text :body_html
      t.datetime :sent_at
      t.string :external_id
      t.string :tracking_token
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :email_messages, :external_id
    add_index :email_messages, :tracking_token, unique: true
    add_index :email_messages, [:campaign_id, :status]
  end
end
