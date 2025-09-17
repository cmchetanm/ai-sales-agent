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
