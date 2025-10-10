# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2025_09_20_135000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "account_profiles", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.text "summary"
    t.text "target_industries", default: [], array: true
    t.text "target_roles", default: [], array: true
    t.text "target_locations", default: [], array: true
    t.jsonb "ideal_customer_profile", default: {}, null: false
    t.jsonb "questionnaire", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_account_profiles_on_account_id"
  end

  create_table "accounts", force: :cascade do |t|
    t.string "name", null: false
    t.bigint "plan_id", null: false
    t.datetime "plan_assigned_at", null: false
    t.boolean "active", default: true, null: false
    t.jsonb "settings", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_accounts_on_name"
    t.index ["plan_id"], name: "index_accounts_on_plan_id"
  end

  create_table "activities", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "lead_id", null: false
    t.bigint "campaign_id"
    t.string "kind", null: false
    t.text "content"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "happened_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "lead_id", "kind"], name: "index_activities_on_account_id_and_lead_id_and_kind"
    t.index ["account_id"], name: "index_activities_on_account_id"
    t.index ["campaign_id"], name: "index_activities_on_campaign_id"
    t.index ["happened_at"], name: "index_activities_on_happened_at"
    t.index ["lead_id"], name: "index_activities_on_lead_id"
  end

  create_table "campaigns", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "pipeline_id"
    t.string "name", null: false
    t.string "channel", null: false
    t.string "status", default: "draft", null: false
    t.jsonb "audience_filters", default: {}, null: false
    t.jsonb "sequence", default: [], null: false
    t.jsonb "schedule", default: {}, null: false
    t.jsonb "metrics", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "channel"], name: "index_campaigns_on_account_id_and_channel"
    t.index ["account_id", "name"], name: "index_campaigns_on_account_id_and_name", unique: true
    t.index ["account_id"], name: "index_campaigns_on_account_id"
    t.index ["pipeline_id"], name: "index_campaigns_on_pipeline_id"
  end

  create_table "chat_messages", force: :cascade do |t|
    t.bigint "chat_session_id", null: false
    t.string "sender_type", null: false
    t.bigint "sender_id"
    t.text "content", null: false
    t.jsonb "metadata", default: {}, null: false
    t.datetime "sent_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["chat_session_id"], name: "index_chat_messages_on_chat_session_id"
    t.index ["sender_type", "sender_id"], name: "index_chat_messages_on_sender_type_and_sender_id"
  end

  create_table "chat_sessions", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "user_id"
    t.string "status", default: "active", null: false
    t.string "context_type"
    t.bigint "context_id"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "closed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_chat_sessions_on_account_id"
    t.index ["context_type", "context_id"], name: "index_chat_sessions_on_context_type_and_context_id"
    t.index ["user_id"], name: "index_chat_sessions_on_user_id"
  end

  create_table "companies", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "name", null: false
    t.string "domain"
    t.string "website"
    t.string "industry"
    t.string "size"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "domain"], name: "index_companies_on_account_id_and_domain", unique: true
    t.index ["account_id"], name: "index_companies_on_account_id"
    t.index ["industry"], name: "index_companies_on_industry"
  end

  create_table "email_messages", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "campaign_id", null: false
    t.bigint "lead_id", null: false
    t.string "direction", default: "outbound", null: false
    t.string "status", default: "pending", null: false
    t.string "subject"
    t.text "body_text"
    t.text "body_html"
    t.datetime "sent_at"
    t.string "external_id"
    t.string "tracking_token"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_email_messages_on_account_id"
    t.index ["campaign_id", "status"], name: "index_email_messages_on_campaign_id_and_status"
    t.index ["campaign_id"], name: "index_email_messages_on_campaign_id"
    t.index ["external_id"], name: "index_email_messages_on_external_id"
    t.index ["lead_id"], name: "index_email_messages_on_lead_id"
    t.index ["tracking_token"], name: "index_email_messages_on_tracking_token", unique: true
  end

  create_table "email_templates", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "name", null: false
    t.string "subject", null: false
    t.text "body", null: false
    t.string "format", default: "html", null: false
    t.string "category", default: "outreach", null: false
    t.string "locale", default: "en", null: false
    t.jsonb "variables", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "name"], name: "index_email_templates_on_account_id_and_name", unique: true
    t.index ["account_id"], name: "index_email_templates_on_account_id"
    t.index ["category"], name: "index_email_templates_on_category"
    t.index ["locale"], name: "index_email_templates_on_locale"
  end

  create_table "follow_ups", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "campaign_id"
    t.bigint "lead_id", null: false
    t.string "channel", null: false
    t.string "status", default: "scheduled", null: false
    t.datetime "execute_at", null: false
    t.jsonb "payload", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "status"], name: "index_follow_ups_on_account_id_and_status"
    t.index ["account_id"], name: "index_follow_ups_on_account_id"
    t.index ["campaign_id"], name: "index_follow_ups_on_campaign_id"
    t.index ["execute_at"], name: "index_follow_ups_on_execute_at"
    t.index ["lead_id"], name: "index_follow_ups_on_lead_id"
  end

  create_table "integration_connections", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "provider", null: false
    t.string "status", default: "inactive", null: false
    t.jsonb "credentials", default: {}, null: false
    t.jsonb "metadata", default: {}, null: false
    t.datetime "last_synced_at"
    t.text "last_error"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "provider"], name: "index_integration_connections_on_account_id_and_provider", unique: true
    t.index ["account_id"], name: "index_integration_connections_on_account_id"
  end

  create_table "leads", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "pipeline_id", null: false
    t.string "source"
    t.string "external_id"
    t.string "status", default: "new", null: false
    t.string "first_name"
    t.string "last_name"
    t.string "email"
    t.string "company"
    t.string "job_title"
    t.string "location"
    t.string "phone"
    t.string "linkedin_url"
    t.string "website"
    t.integer "score"
    t.datetime "last_contacted_at"
    t.jsonb "enrichment", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "company_id"
    t.bigint "assigned_user_id"
    t.boolean "do_not_contact", default: false, null: false
    t.datetime "email_opt_out_at"
    t.jsonb "attribution", default: {}, null: false
    t.index ["account_id", "assigned_user_id"], name: "index_leads_on_account_id_and_assigned_user_id"
    t.index ["account_id", "company_id"], name: "index_leads_on_account_id_and_company_id"
    t.index ["account_id", "email"], name: "index_leads_on_account_id_and_email", unique: true
    t.index ["account_id", "external_id"], name: "index_leads_on_account_id_and_external_id"
    t.index ["account_id", "status"], name: "index_leads_on_account_id_and_status"
    t.index ["account_id", "updated_at"], name: "index_leads_on_account_id_and_updated_at"
    t.index ["account_id"], name: "index_leads_on_account_id"
    t.index ["assigned_user_id"], name: "index_leads_on_assigned_user_id"
    t.index ["company_id"], name: "index_leads_on_company_id"
    t.index ["do_not_contact"], name: "index_leads_on_do_not_contact"
    t.index ["pipeline_id", "status"], name: "index_leads_on_pipeline_id_and_status"
    t.index ["pipeline_id"], name: "index_leads_on_pipeline_id"
    t.index ["source"], name: "index_leads_on_source"
  end

  create_table "pipelines", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "name", null: false
    t.text "description"
    t.string "status", default: "active", null: false
    t.jsonb "stage_definitions", default: [], null: false
    t.boolean "primary", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "name"], name: "index_pipelines_on_account_id_and_name", unique: true
    t.index ["account_id"], name: "index_pipelines_on_account_id"
  end

  create_table "plans", force: :cascade do |t|
    t.string "name", null: false
    t.string "slug", null: false
    t.text "description"
    t.integer "monthly_price_cents", default: 0, null: false
    t.jsonb "limits", default: {}, null: false
    t.jsonb "features", default: {}, null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_plans_on_slug", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "first_name"
    t.string "last_name"
    t.string "title"
    t.string "timezone"
    t.string "role", default: "owner", null: false
    t.boolean "active", default: true, null: false
    t.datetime "last_active_at"
    t.jsonb "metadata", default: {}, null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "email"], name: "index_users_on_account_id_and_email", unique: true
    t.index ["account_id", "role"], name: "index_users_on_account_id_and_role"
    t.index ["account_id"], name: "index_users_on_account_id"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "account_profiles", "accounts"
  add_foreign_key "accounts", "plans"
  add_foreign_key "activities", "accounts"
  add_foreign_key "activities", "campaigns"
  add_foreign_key "activities", "leads"
  add_foreign_key "campaigns", "accounts"
  add_foreign_key "campaigns", "pipelines"
  add_foreign_key "chat_messages", "chat_sessions"
  add_foreign_key "chat_sessions", "accounts"
  add_foreign_key "chat_sessions", "users"
  add_foreign_key "companies", "accounts"
  add_foreign_key "email_messages", "accounts"
  add_foreign_key "email_messages", "campaigns"
  add_foreign_key "email_messages", "leads"
  add_foreign_key "email_templates", "accounts"
  add_foreign_key "follow_ups", "accounts"
  add_foreign_key "follow_ups", "campaigns"
  add_foreign_key "follow_ups", "leads"
  add_foreign_key "integration_connections", "accounts"
  add_foreign_key "leads", "accounts"
  add_foreign_key "leads", "companies"
  add_foreign_key "leads", "pipelines"
  add_foreign_key "leads", "users", column: "assigned_user_id"
  add_foreign_key "pipelines", "accounts"
  add_foreign_key "users", "accounts"
end
