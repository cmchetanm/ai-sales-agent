class CreateAccountProfiles < ActiveRecord::Migration[7.1]
  def change
    create_table :account_profiles do |t|
      t.references :account, null: false, foreign_key: true
      t.text :summary
      t.text :target_industries, array: true, default: []
      t.text :target_roles, array: true, default: []
      t.text :target_locations, array: true, default: []
      t.jsonb :ideal_customer_profile, null: false, default: {}
      t.jsonb :questionnaire, null: false, default: {}
      t.timestamps
    end
  end
end
