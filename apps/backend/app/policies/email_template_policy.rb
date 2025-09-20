# frozen_string_literal: true

class EmailTemplatePolicy < ApplicationPolicy
  def index? = user.present?
  def show? = record.account_id == user.account_id
  def create? = user.present?
  def update? = record.account_id == user.account_id
  def destroy? = record.account_id == user.account_id

  class Scope < Scope
    def resolve
      scope.where(account_id: user.account_id)
    end
  end
end

