class CreateIntegrationConnections < ActiveRecord::Migration[7.1]
  def change
    create_table :integration_connections do |t|
      t.references :account, null: false, foreign_key: true
      t.string :provider, null: false
      t.string :status, null: false, default: 'inactive'
      t.jsonb :credentials, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.datetime :last_synced_at
      t.text :last_error
      t.timestamps
    end

    add_index :integration_connections, [:account_id, :provider], unique: true
  end
end
