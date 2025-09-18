# frozen_string_literal: true

class ApplicationSerializer
  attr_reader :resource

  def initialize(resource)
    @resource = resource
  end

  def as_json(*_args)
    serializable_hash
  end

  def serializable_hash
    raise NotImplementedError, 'Implement in subclasses'
  end
end
