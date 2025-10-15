class AddLowerEmailUniqueIndex < ActiveRecord::Migration[7.1]
  def change
    # Functional unique index on lower(email) per account for case-insensitive uniqueness
    add_index :leads, "(LOWER(email)), account_id", unique: true, name: 'index_leads_on_lower_email_and_account_id'
  end
end
