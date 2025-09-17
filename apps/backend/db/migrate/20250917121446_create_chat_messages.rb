class CreateChatMessages < ActiveRecord::Migration[7.1]
  def change
    create_table :chat_messages do |t|
      t.references :chat_session, null: false, foreign_key: true
      t.string :sender_type, null: false
      t.bigint :sender_id
      t.text :content, null: false
      t.jsonb :metadata, null: false, default: {}
      t.datetime :sent_at, null: false
      t.timestamps
    end

    add_index :chat_messages, [:sender_type, :sender_id]
  end
end
