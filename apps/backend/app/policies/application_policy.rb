# frozen_string_literal: true

class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def index?
    true
  end

  def show?
    true
  end

  def create?
    admin_or_owner?
  end

  def new?
    create?
  end

  def update?
    admin_or_owner?
  end

  def edit?
    update?
  end

  def destroy?
    admin_or_owner?
  end

  class Scope
    attr_reader :user, :scope

    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      scope
    end
  end

  private

  def admin_or_owner?
    user&.admin? || user&.owner?
  end
end

