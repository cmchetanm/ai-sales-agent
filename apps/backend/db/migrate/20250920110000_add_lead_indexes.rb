class AddLeadIndexes < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  def change
    add_index :leads, [:account_id, :status], algorithm: :concurrently unless index_exists?(:leads, [:account_id, :status])
    add_index :leads, [:account_id, :updated_at], algorithm: :concurrently unless index_exists?(:leads, [:account_id, :updated_at])
  end
end

