# frozen_string_literal: true

class UserSerializer
  def initialize(user)
    @user = user
  end

  def serializable_hash
    {
      data: {
        id: user.id,
        type: 'user',
        attributes: {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          account_id: user.account_id
        }
      }
    }
  end

  private

  attr_reader :user
end
