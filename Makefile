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
DOCKER_COMPOSE_EXEC := docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) exec

BACKEND_SERVICE := backend
EMAILING_SERVICE := emailing
FRONTEND_SERVICE := frontend
LLM_SERVICE := llm_service

.PHONY: help env bootstrap up down restart recreate logs logs-backend logs-emailing logs-llm ps build compose-config lint \
        db-prepare db-reset seed seed-all backend-test backend-spec emailing-test llm-test frontend-test test-all \
        backend-console backend-bash backend-routes backend-rails emailing-console emailing-bash emailing-rails llm-bash emailing-dispatch clean

help:
	@echo "Available targets:"
	@echo "  make bootstrap ENV=development   # Install tooling, prepare environment"
	@echo "  make up ENV=development           # Start services for the selected environment"
	@echo "  make down ENV=development         # Stop services for the selected environment"
	@echo "  make restart ENV=development      # Restart running containers"
	@echo "  make recreate ENV=development     # Down then up (recreate)"
	@echo "  make logs ENV=development         # Tail logs"
	@echo "  make logs-backend                 # Tail backend logs"
	@echo "  make logs-emailing                # Tail emailing logs"
	@echo "  make logs-llm                     # Tail LLM service logs"
	@echo "  make ps ENV=development           # Show container status"
	@echo "  make build ENV=development        # Rebuild images"
	@echo "  make compose-config               # Print resolved compose config"
	@echo "  make db-prepare                   # Run database migrations/seeds"
	@echo "  make db-reset CONFIRM=yes         # Drop, create, migrate (both apps)"
	@echo "  make backend-test                 # Run backend API test suite"
	@echo "  make backend-spec SPEC=path       # Run a subset of backend specs"
	@echo "  make emailing-test                # Run emailing service test suite"
	@echo "  make emailing-dispatch            # Trigger emailing dispatcher once"
	@echo "  make frontend-test                # Install deps & run frontend checks"
	@echo "  make test                         # Run all available test suites"
	@echo "  make lint                         # Run all linters (placeholder)"
	@echo "  make backend-console              # Rails console (backend)"
	@echo "  make backend-bash                 # Shell into backend container"
	@echo "  make backend-routes               # Show backend routes"
	@echo "  make emailing-console             # Rails console (emailing)"
	@echo "  make emailing-bash                # Shell into emailing container"
	@echo "  make llm-bash                     # Shell into llm_service container"
	@echo "  make seed-all                     # Seed backend and emailing"
	@echo "  make env                          # Show compose/env paths"

bootstrap:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	$(MAKE) db-prepare
	@echo "Bootstrap complete for $(ENV)."

env:
	@echo "ENV=$(ENV)"
	@echo "ENV_FILE=$(ENV_FILE)"
	@echo "COMPOSE_FILE=$(COMPOSE_FILE)"

up:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) up -d

restart:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) restart

recreate: down up

_down:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) down

down: _down
	@$(DOCKER_COMPOSE) rm -fsv

logs:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) logs -f

logs-backend:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) logs -f $(BACKEND_SERVICE)

logs-emailing:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) logs -f $(EMAILING_SERVICE)

logs-llm:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) logs -f $(LLM_SERVICE)

ps:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) ps

build:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) build

compose-config:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) config

lint:
	@echo "TODO: Implement repo-wide lint runner."

db-prepare:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm $(BACKEND_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails db:prepare"
	@$(DOCKER_COMPOSE) run --rm $(EMAILING_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails db:prepare"

db-reset:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@if [ "$(CONFIRM)" != "yes" ]; then \\
	  echo "Refusing to reset DB without CONFIRM=yes"; exit 1; \\
	fi
	@$(DOCKER_COMPOSE) run --rm $(BACKEND_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails db:drop db:create db:migrate"
	@$(DOCKER_COMPOSE) run --rm $(EMAILING_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails db:drop db:create db:migrate"

seed:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm $(BACKEND_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails db:seed"

seed-all: seed
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm $(EMAILING_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails db:seed"

backend-test:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm -e RAILS_ENV=test $(BACKEND_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails db:prepare && bundle exec rspec"

# Run a subset of backend specs: make backend-spec SPEC=spec/requests/..._spec.rb
backend-spec:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@test -n "$(SPEC)" || (echo "Usage: make backend-spec SPEC=path/to/spec.rb" && exit 1)
	@$(DOCKER_COMPOSE) run --rm -e RAILS_ENV=test $(BACKEND_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails db:prepare && bundle exec rspec $(SPEC)"

emailing-test:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm -e RAILS_ENV=test $(EMAILING_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails db:prepare && bundle exec rspec"

emailing-dispatch:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm $(EMAILING_SERVICE) bash -lc "bundle exec rails runner 'EmailDispatcherJob.perform_now'"

# Developer convenience commands
backend-console:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm $(BACKEND_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails console"

backend-bash:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm $(BACKEND_SERVICE) bash -lc "bash"

backend-routes:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm $(BACKEND_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails routes -g api"

backend-rails:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@test -n "$(CMD)" || (echo "Usage: make backend-rails CMD=\"db:migrate\"" && exit 1)
	@$(DOCKER_COMPOSE) run --rm $(BACKEND_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails $(CMD)"

emailing-console:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm $(EMAILING_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails console"

emailing-bash:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm $(EMAILING_SERVICE) bash -lc "bash"

emailing-rails:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@test -n "$(CMD)" || (echo "Usage: make emailing-rails CMD=\"db:migrate\"" && exit 1)
	@$(DOCKER_COMPOSE) run --rm $(EMAILING_SERVICE) bash -lc "(bundle check || bundle install) && bundle exec rails $(CMD)"

llm-bash:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@$(DOCKER_COMPOSE) run --rm $(LLM_SERVICE) sh -lc "sh"

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
