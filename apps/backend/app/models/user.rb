class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable,
         :jwt_authenticatable, jwt_revocation_strategy: Devise::JWT::RevocationStrategies::Null

  belongs_to :account

  has_many :chat_sessions, dependent: :nullify

  enum :role, {
    owner: 'owner',
    admin: 'admin',
    contributor: 'contributor',
    viewer: 'viewer'
  }, validate: true

  validates :email, presence: true, uniqueness: { scope: :account_id, case_sensitive: false }, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, presence: true, confirmation: true, length: { minimum: 10 }, if: :password_required?
  validates :role, presence: true

  scope :active, -> { where(active: true) if column_names.include?('active') }

  def display_name
    [first_name, last_name].compact_blank.join(' ').presence || email
  end

  def active_for_authentication?
    super && active?
  end

  def inactive_message
    active? ? super : :inactive
  end

  private

  def password_required?
    !persisted? || password.present? || password_confirmation.present?
  end
end
