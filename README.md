# Final AI Sales Agent Monorepo

This repository hosts the services that power the AI-driven sales enablement platform. It is organized as a monorepo with dedicated applications for the API backend, emailing workflows, LLM orchestration, and the user-facing frontend.

## Repository Layout

- `apps/backend` – Ruby on Rails API for core business logic, user management, and lead orchestration.
- `apps/emailing` – Rails-based service responsible for campaign execution, mailbox syncing, and follow-up scheduling.
- `apps/frontend` – React (Vercel v0) frontend delivering the user experience and dashboards.
- `apps/llm_service` – Python FastAPI service using LangChain to guide conversations and automate lead discovery.
- `ops/compose` – Docker Compose definitions for development, staging, and production environments.
- `ops/env` – Environment configuration files consumed by Compose and the Make targets.
- `scripts` – Utility scripts for bootstrap, linting, and automation.

## Getting Started

Consult the `Makefile` for common workflows. Each environment (`development`, `staging`, `production`) expects a corresponding `.env` file under `ops/env/`. Provide valid credentials before starting containers.

Detailed setup instructions will be added as the individual services are implemented.

### Backend API quick start

- Install Docker and ensure it is running.
- Run `docker compose --env-file ops/env/.env.development -f ops/compose/docker-compose.dev.yml run --rm backend bundle exec rails db:prepare` to prepare databases.
- Execute tests with `docker compose --env-file ops/env/.env.development -f ops/compose/docker-compose.dev.yml run --rm backend bundle exec rspec`.
