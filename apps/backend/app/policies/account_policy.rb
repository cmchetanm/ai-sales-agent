# frozen_string_literal: true

class AccountPolicy < ApplicationPolicy
  def show?
    record.id == user.account_id
  end

  def update?
    admin_or_owner?
  end
end

