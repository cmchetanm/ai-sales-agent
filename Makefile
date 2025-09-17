SHELL := /bin/bash
ENV ?= development
COMPOSE_FILE := ops/compose/docker-compose.$(ENV).yml
ENV_FILE := ops/env/.env.$(ENV)

DOCKER_COMPOSE := docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE)

.PHONY: help bootstrap up down logs ps build lint test clean

help:
	@echo "Available targets:"
	@echo "  make bootstrap ENV=development   # Install tooling, prepare environment"
	@echo "  make up ENV=development           # Start services for the selected environment"
	@echo "  make down ENV=development         # Stop services for the selected environment"
	@echo "  make logs ENV=development         # Tail logs"
	@echo "  make ps ENV=development           # Show container status"
	@echo "  make build ENV=development        # Rebuild images"
	@echo "  make lint                         # Run all linters (placeholder)"
	@echo "  make test                         # Run all test suites (placeholder)"

bootstrap:
	@test -f $(ENV_FILE) || (echo "Missing env file: $(ENV_FILE)" && exit 1)
	@echo "Bootstrap tasks will be implemented as services come online."

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

test:
	@echo "TODO: Implement repo-wide test runner to ensure 80%+ coverage."

clean:
	@$(DOCKER_COMPOSE) down -v --remove-orphans
