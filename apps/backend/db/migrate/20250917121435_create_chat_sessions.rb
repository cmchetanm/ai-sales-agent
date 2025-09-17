class CreateChatSessions < ActiveRecord::Migration[7.1]
  def change
    create_table :chat_sessions do |t|
      t.references :account, null: false, foreign_key: true
      t.references :user, foreign_key: true
      t.string :status, null: false, default: 'active'
      t.string :context_type
      t.bigint :context_id
      t.jsonb :metadata, null: false, default: {}
      t.datetime :closed_at
      t.timestamps
    end

    add_index :chat_sessions, [:context_type, :context_id]
  end
end
