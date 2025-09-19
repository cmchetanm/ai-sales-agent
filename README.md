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

### Local runtime quick start

- Install Docker and ensure it is running.
- Prepare the shared Postgres database (runs migrations for both Rails services):
  `make db-prepare ENV=development`
- Boot the full stack (API, emailing, LLM service, frontend, Redis, Postgres, Qdrant):
  `make up ENV=development`
- Visit `http://localhost:5173` for the frontend and `http://localhost:3000/api/v1/health` for the backend health probe.
- When finished, stop everything with `make down ENV=development`.

### API docs

- OpenAPI (minimal): `http://localhost:3000/api/v1/openapi.yaml`
- Swagger UI: `http://localhost:3000/api/v1/api-docs`

### Demo data

- Seed demo plan/account/user/pipeline/leads/campaign:
  `make seed ENV=development`
- Demo login: `demo@acme.test` / `DemoPass123!`

### Apollo integration

- Default behavior uses sample results in development/test. To enable real Apollo API calls locally, set `APOLLO_ENABLED=true` and provide a valid `APOLLO_API_KEY` in `ops/env/.env.development`, then restart services.

### Localization

- Backend and emailing services respect `Accept-Language` and `?locale=` (supported: `en`, `es`). Error messages are localized; API status tokens remain stable.
- Frontend uses react-i18next with language detection and a language selector in the header. Default language is English; Spanish is included as an example.
- LLM service localizes system and heuristic messages from `Accept-Language`.
 - API endpoints are available both under `/api/v1/...` and `/:locale/api/v1/...`.
   - To force clients to use localized prefixes, enable 307 redirects with `API_LOCALE_REDIRECT_ENABLED=true` (preserves method/body for POST/PATCH/DELETE).

### Testing

- Backend API specs: `make backend-test`
- Emailing service specs: `make emailing-test`
- Frontend build check: `make frontend-test`
- Run everything (including placeholder services): `make test-all`

### Security

- Rate limiting via Rack::Attack is enabled in production and can be toggled locally with `RACK_ATTACK_ENABLED=true` in `ops/env/.env.development`.
