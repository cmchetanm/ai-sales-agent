class CreateEmailTemplates < ActiveRecord::Migration[7.1]
  def change
    create_table :email_templates do |t|
      t.references :account, null: false, foreign_key: true
      t.string :name, null: false
      t.string :subject, null: false
      t.text :body, null: false
      t.string :format, null: false, default: 'html'
      t.string :category, null: false, default: 'outreach'
      t.string :locale, null: false, default: 'en'
      t.jsonb :variables, null: false, default: {}
      t.timestamps
    end
    add_index :email_templates, [:account_id, :name], unique: true
    add_index :email_templates, :category
    add_index :email_templates, :locale
  end
end

