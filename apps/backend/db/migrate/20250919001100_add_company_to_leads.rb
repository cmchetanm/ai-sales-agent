class AddCompanyToLeads < ActiveRecord::Migration[7.1]
  def change
    add_reference :leads, :company, foreign_key: true
    add_index :leads, [:account_id, :company_id]
  end
end

