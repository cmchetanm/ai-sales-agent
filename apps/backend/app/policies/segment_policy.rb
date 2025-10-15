# frozen_string_literal: true

class SegmentPolicy < ApplicationPolicy
  def show?
    record.account_id == user.account_id
  end

  def create?
    admin_or_owner?
  end

  def destroy?
    admin_or_owner?
  end

  class Scope < Scope
    def resolve
      scope.where(account_id: user.account_id)
    end
  end
end

