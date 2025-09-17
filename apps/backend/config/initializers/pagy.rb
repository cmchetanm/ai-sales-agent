# frozen_string_literal: true

require 'pagy/extras/overflow'
require 'pagy/extras/metadata'

default_items = ENV.fetch('PAGY_DEFAULT_LIMIT', 20).to_i
Pagy::DEFAULT[:items] = default_items
Pagy::DEFAULT[:overflow] = :last_page
