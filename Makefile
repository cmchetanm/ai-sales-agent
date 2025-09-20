SHELL := /bin/bash
ENV ?= development

ifeq ($(ENV),development)
COMPOSE_SUFFIX := dev
else ifeq ($(ENV),production)
COMPOSE_SUFFIX := prod
else
COMPOSE_SUFFIX := $(ENV)
endif

COMPOSE_FILE := ops/compose/docker-compose.$(COMPOSE_SUFFIX).yml
ENV_FILE := ops/env/.env.$(ENV)

DOCKER_COMPOSE := docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE)

BACKEND_SERVICE := backend
EMAILING_SERVICE := emailing
FRONTEND_SERVICE := frontend
LLM_SERVICE := llm_service

.PHONY: help bootstrap up down logs ps build lint test clean db-prepare seed backend-test emailing-test llm-test frontend-test test-all

help:
	@echo "Available targets:"
	@echo "  make bootstrap ENV=development   # Install tooling, prepare environment"
	@echo "  make up ENV=development           # Start services for the selected environment"
	@echo "  make down ENV=development         # Stop services for the selected environment"
	@echo "  make logs ENV=development         # Tail logs"
	@echo "  make ps ENV=development           # Show container status"
	@echo "  make build ENV=development        # Rebuild images"
	@echo "  make db-prepare                   # Run database migrations/seeds"
	@echo "  make backend-test                 # Run backend API test suite"
	@echo "  make emailing-test                # Run emailing service test suite"
	@echo "  make frontend-test                # Install deps & run frontend checks"
	@echo "  make test                         # Run all available test suites"
	@echo "  make lint                         # Run all linters (placeholder)"

bootstrap:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	$(MAKE) db-prepare
	@echo "Bootstrap complete for $(ENV)."

up:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) up -d

_down:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) down

down: _down
	@$(DOCKER_COMPOSE) rm -fsv

logs:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) logs -f

ps:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) ps

build:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) build

lint:
	@echo "TODO: Implement repo-wide lint runner."

db-prepare:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm $(BACKEND_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails db:prepare"
	@$(DOCKER_COMPOSE) run --rm $(EMAILING_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails db:prepare"

seed:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm $(BACKEND_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails db:seed"

backend-test:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm -e RAILS_ENV=test $(BACKEND_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails db:prepare && bundle exec rspec"

emailing-test:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm -e RAILS_ENV=test $(EMAILING_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails db:prepare && bundle exec rspec"

llm-test:
	@echo "TODO: add python test command (pytest) once implemented"

frontend-test:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm $(FRONTEND_SERVICE) sh -lc "pnpm install --no-frozen-lockfile && pnpm run test:ci"

test: backend-test emailing-test frontend-test

# Back-compat alias
test-all: test

clean:
	@$(DOCKER_COMPOSE) down -v --remove-orphans
