# frozen_string_literal: true

class CompanyPolicy < ApplicationPolicy
  def show?
    record.account_id == user.account_id
  end

  class Scope < Scope
    def resolve
      scope.where(account_id: user.account_id)
    end
  end
end

