# frozen_string_literal: true

class Contact < ApplicationRecord
  belongs_to :account
  belongs_to :company, optional: true
  has_many :deals, dependent: :nullify

  validates :email, allow_blank: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :email, uniqueness: { scope: :account_id, case_sensitive: false }, allow_blank: true

  def display_name
    [first_name, last_name].compact_blank.join(' ').presence || email
  end
end

