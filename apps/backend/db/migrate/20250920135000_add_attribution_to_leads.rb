class AddAttributionToLeads < ActiveRecord::Migration[7.1]
  def change
    add_column :leads, :attribution, :jsonb, null: false, default: {}
    add_index :leads, :source
  end
end

