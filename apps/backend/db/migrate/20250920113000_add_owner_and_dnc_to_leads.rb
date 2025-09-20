class AddOwnerAndDncToLeads < ActiveRecord::Migration[7.1]
  def change
    add_reference :leads, :assigned_user, foreign_key: { to_table: :users }
    add_column :leads, :do_not_contact, :boolean, null: false, default: false
    add_column :leads, :email_opt_out_at, :datetime
    add_index :leads, [:account_id, :assigned_user_id]
    add_index :leads, :do_not_contact
  end
end

