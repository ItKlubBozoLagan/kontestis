[![🧪 Test](https://github.com/ItKlubBozoLagan/kontestis/actions/workflows/test.yml/badge.svg)](https://github.com/ItKlubBozoLagan/kontestis/actions/workflows/test.yml)
[![🔍 Lint](https://github.com/ItKlubBozoLagan/kontestis/actions/workflows/lint.yml/badge.svg)](https://github.com/ItKlubBozoLagan/kontestis/actions/workflows/lint.yml)
[![📦 Typecheck](https://github.com/ItKlubBozoLagan/kontestis/actions/workflows/typecheck.yml/badge.svg)](https://github.com/ItKlubBozoLagan/kontestis/actions/workflows/typecheck.yml)

# Kontestis

A full-stack **code contest and online judge platform** built with TypeScript. Originally developed for the [2023 InfoKup Competition](https://informatika.azoo.hr/kategorija/3/Razvoj-softvera).

Kontestis lets you create programming contests, manage problems with custom test cases, and automatically evaluate code submissions in multiple languages — all through a modern web interface.

## Features

- **Contests** — timed competitions with leaderboards, announcements, Q&A, and join-code access control
- **Problem management** — create problems with test cases, generators, and multiple evaluation modes (plain, checker, interactive, output-only)
- **Multi-language evaluation** — submit solutions in C, C++, Python, Java, Go, and Rust
- **Organizations** — group users and contests under organizations with role-based permissions
- **Exam mode** — final submissions, grading scales, and score exports
- **Authentication** — Google OAuth, AAI-Edu OIDC (Croatian education federation), and managed email/password accounts
- **ELO rating system** — automatic rating calculation based on contest results
- **Metrics & analytics** — submission statistics, system metrics, and admin dashboards via InfluxDB

## Architecture

Kontestis is a **pnpm monorepo** with three applications and three shared packages:

```
kontestis/
├── apps/
│   ├── backend/        # REST API server (Express.js + ScyllaDB + Redis)
│   ├── frontend/       # Web UI (React + Vite + Tailwind CSS)
│   └── function/       # Code evaluation microservice
├── packages/
│   ├── models/         # Shared TypeScript types and data models
│   ├── utils/          # Shared utility functions (with tests)
│   └── scripts/        # Build and development scripts
├── .deploy/            # Production Dockerfiles
├── .github/workflows/  # CI/CD pipelines
└── docker-compose.yml  # Local development environment
```

### Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Zustand, React Query, React Router 6 |
| **Backend** | Express.js, TypeBox validation, JWT auth, Snowflake IDs |
| **Database** | ScyllaDB (Cassandra-compatible) via Scyllo ORM |
| **Cache / Queue** | Redis |
| **Metrics** | InfluxDB |
| **Object storage** | MinIO (S3-compatible) |
| **Evaluator** | Isolated microservice with language-specific compilers |
| **Language** | TypeScript throughout (Node.js v18) |

## Prerequisites

- [Node.js](https://nodejs.org/) v18.12.1 (see `.nvmrc`)
- [pnpm](https://pnpm.io/) v9.10.0+
- [Docker](https://www.docker.com/) and Docker Compose (for local infrastructure)

## Getting started

### 1. Clone and install dependencies

```bash
git clone https://github.com/ItKlubBozoLagan/kontestis.git
cd kontestis
pnpm install
```

### 2. Configure environment variables

Copy the example environment file and set your JWT secret:

```bash
cp global.env.example global.env
```

Edit `global.env` and provide a value for `JWT_SECRET`. The Google evaluator service account variables are optional for local development.

### 3. Start the development environment

Docker Compose spins up all infrastructure services (ScyllaDB, Redis, InfluxDB, MinIO) along with the application:

```bash
docker compose up
```

This starts:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Evaluator | http://localhost:8081 |
| InfluxDB UI | http://localhost:8086 |
| MinIO Console | http://localhost:9001 |

> **Note:** The backend waits for ScyllaDB to be healthy before starting. Database migrations run automatically on first launch.

## Environment variables

### Backend

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret key for signing JWT tokens (required) |
| `MODE` | `development` or `production` |
| `PORT` | Server port (default: `8080`) |
| `DB_HOST`, `DB_PORT`, `DB_KEYSPACE`, `DB_DATACENTER` | ScyllaDB connection |
| `REDIS_URL` | Redis connection string |
| `INFLUXDB_URL` | InfluxDB endpoint |
| `OAUTH_CLIENT_ID` | Google OAuth client ID |
| `EVALUATOR_ENDPOINT` | URL of the evaluation microservice |
| `CAPTCHA_DISABLED` | Set to `true` to disable reCAPTCHA in development |
| `S3_ENDPOINT`, `S3_PORT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | MinIO / S3 credentials |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_ENDPOINT` | Backend API URL |
| `VITE_OAUTH_CLIENT_ID` | Google OAuth client ID |
| `VITE_CAPTCHA_SITE_KEY` | reCAPTCHA v3 site key |
| `VITE_AAI_EDU_LOGOUT_URL` | AAI-Edu OIDC logout endpoint |
| `VITE_AAI_EDU_LOGOUT_REDIRECT_URL` | Post-logout redirect URL |

## Development

### Scripts

Run from the repository root:

```bash
pnpm lint          # ESLint across all apps and packages
pnpm typecheck     # TypeScript type checking in all packages
pnpm test          # Jest tests (packages/utils)
```

### Code style

- **Linter:** ESLint with TypeScript, sonarjs, and import sorting plugins
- **Formatter:** Prettier (double quotes, 100-char line width)
- **Pre-commit hooks:** Husky

## Testing

Tests use [Jest](https://jestjs.io/) with `ts-jest` and live in `packages/utils/src/` alongside the source files (`*.spec.ts`).

```bash
pnpm test
```

## Deployment

Production Docker images are built with multi-stage Dockerfiles in `.deploy/`:

- **Backend** — pushed to GitHub Container Registry (`ghcr.io`) on merges to `main`
- **Backend staging** — pushed on merges to `dev`
- **Evaluator** — deployed to Google Cloud Run via Workload Identity Federation
- **Frontend** — built as static assets via `vite build` (deploy to any static hosting provider)

See `.github/workflows/` for the full CI/CD pipeline definitions.

## Related projects

- [ItKlubBozoLagan/evaluator-v2](https://github.com/ItKlubBozoLagan/evaluator-v2/) — standalone evaluator service

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
