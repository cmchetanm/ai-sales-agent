class AddLeadFieldsAndIndexes < ActiveRecord::Migration[7.1]
  def change
    add_column :leads, :locked, :boolean, null: false, default: false
    add_column :leads, :verification_status, :string
    add_column :leads, :tags, :jsonb, null: false, default: []

    # Unique (account, source, external_id) when external_id present
    add_index :leads, [:account_id, :source, :external_id], unique: true, name: 'idx_unique_lead_source_external', where: 'external_id IS NOT NULL'
  end
end
