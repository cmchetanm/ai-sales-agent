class ExtendActivitiesSubject < ActiveRecord::Migration[7.1]
  def change
    change_column_null :activities, :lead_id, true
    add_reference :activities, :contact, foreign_key: true
    add_reference :activities, :deal, foreign_key: true
    add_index :activities, [:account_id, :contact_id, :kind]
    add_index :activities, [:account_id, :deal_id, :kind]
  end
end

