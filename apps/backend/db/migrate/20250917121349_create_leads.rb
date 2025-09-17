class CreateLeads < ActiveRecord::Migration[7.1]
  def change
    create_table :leads do |t|
      t.references :account, null: false, foreign_key: true
      t.references :pipeline, null: false, foreign_key: true
      t.string :source
      t.string :external_id
      t.string :status, null: false, default: 'new'
      t.string :first_name
      t.string :last_name
      t.string :email
      t.string :company
      t.string :job_title
      t.string :location
      t.string :phone
      t.string :linkedin_url
      t.string :website
      t.integer :score
      t.datetime :last_contacted_at
      t.jsonb :enrichment, null: false, default: {}
      t.timestamps
    end

    add_index :leads, [:account_id, :email], unique: true
    add_index :leads, [:account_id, :external_id]
    add_index :leads, [:pipeline_id, :status]
  end
end
