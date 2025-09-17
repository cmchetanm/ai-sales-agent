class CreatePipelines < ActiveRecord::Migration[7.1]
  def change
    create_table :pipelines do |t|
      t.references :account, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.string :status, null: false, default: 'active'
      t.jsonb :stage_definitions, null: false, default: []
      t.boolean :primary, null: false, default: false
      t.timestamps
    end

    add_index :pipelines, [:account_id, :name], unique: true
  end
end
