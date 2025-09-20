plans = [
  {
    name: 'Basic',
    slug: 'basic',
    description: 'Great for early teams exploring automated lead flows.',
    monthly_price_cents: 0,
    limits: { leads_per_month: 250, campaigns_per_month: 1, seats: 3 },
    features: { enabled: %w[internal_db_search basic_campaigns] }
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'Adds advanced sequencing, integrations and automation.',
    monthly_price_cents: 29900,
    limits: { leads_per_month: 2500, campaigns_per_month: 5, seats: 10 },
    features: { enabled: %w[internal_db_search advanced_campaigns integrations analytics] }
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Unlimited scale with dedicated support and custom workflows.',
    monthly_price_cents: 89900,
    limits: { leads_per_month: nil, campaigns_per_month: nil, seats: nil },
    features: { enabled: %w[internal_db_search advanced_campaigns integrations analytics custom_models priority_support] }
  }
]

plans.each do |attrs|
  Plan.find_or_initialize_by(slug: attrs[:slug]).tap do |plan|
    plan.assign_attributes(attrs)
    plan.save!
  end
end

# Demo data (idempotent)
if ENV.fetch('SEED_DEMO', 'true').casecmp?('true')
  basic = Plan.find_by(slug: 'basic') || Plan.active.first || Plan.first
  if basic
    account = Account.find_or_create_by!(name: 'Acme Demo') do |a|
      a.plan = basic
      a.plan_assigned_at = Time.current
      a.settings = {}
    end

    owner = account.users.find_or_create_by!(email: 'demo@acme.test') do |u|
      u.first_name = 'Demo'
      u.last_name = 'User'
      u.password = 'DemoPass123!'
      u.password_confirmation = 'DemoPass123!'
      u.role = 'owner'
      u.active = true
    end

    primary_pipeline = account.pipelines.find_or_create_by!(name: 'Sales Pipeline') do |p|
      p.status = 'active'
      p.primary = true
      p.stage_definitions = [{ 'name' => 'New' }, { 'name' => 'Contacted' }, { 'name' => 'Qualified' }, { 'name' => 'Won' }]
    end

    account.pipelines.find_or_create_by!(name: 'Marketing Pipeline') do |p|
      p.status = 'active'
      p.primary = false
      p.stage_definitions = [{ 'name' => 'New' }, { 'name' => 'Engaged' }]
    end

    10.times do |i|
      account.leads.find_or_create_by!(email: "lead#{i + 1}@example.com") do |l|
        l.pipeline = primary_pipeline
        l.first_name = "Lead#{i + 1}"
        l.last_name = 'Example'
        l.company = 'Example Co'
        l.status = 'new'
        l.source = 'seed'
      end
    end

    account.campaigns.find_or_create_by!(name: 'Welcome Series') do |c|
      c.pipeline = primary_pipeline
      c.channel = 'email'
      c.status = 'draft'
      c.audience_filters = { 'status' => 'new' }
    end

    # Email templates (demo)
    account.email_templates.find_or_create_by!(name: 'Intro') do |t|
      t.subject = 'Quick intro'
      t.body = '<p>Hi {{first_name}},</p><p>I loved your work at {{company}}. Can we chat about {{topic}}?</p>'
      t.format = 'html'
      t.category = 'outreach'
      t.locale = 'en'
      t.variables = { sample: { first_name: 'Ava', company: 'Acme', topic: 'AI automation' } }
    end
    account.email_templates.find_or_create_by!(name: 'Follow Up 1') do |t|
      t.subject = 'Following up'
      t.body = 'Just bubbling this up. Any thoughts on {{topic}}?'
      t.format = 'text'
      t.category = 'follow_up'
      t.locale = 'en'
      t.variables = { sample: { topic: 'AI automation' } }
    end
  end
end
