# RotiRozi — Restaurant POS SaaS

A full-stack, multi-tenant Restaurant Management System & Point-of-Sale application built with NestJS, React, PostgreSQL, and Redis.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 10, Prisma ORM, Passport JWT |
| Frontend | React 18, Vite 5, Tailwind CSS, Zustand |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Monorepo | pnpm workspaces |
| Shared | TypeScript types/DTOs (`@pos/shared`) |

## Prerequisites

Make sure you have the following installed before setting up the project:

| Tool | Minimum Version | Install Guide |
|------|----------------|---------------|
| **Node.js** | 18.x or higher | [nodejs.org](https://nodejs.org/) or `nvm install 18` |
| **pnpm** | 8.x or higher | `npm install -g pnpm` |
| **Docker** & **Docker Compose** | Docker 20+, Compose v2 | [docker.com](https://docs.docker.com/get-docker/) |
| **Git** | any recent version | [git-scm.com](https://git-scm.com/) |

### Verify installations

```bash
node --version    # should print v18.x.x or higher
pnpm --version   # should print 8.x.x or higher
docker --version  # should print Docker version 20+
docker compose version  # should print v2.x.x
```

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/ranaincode07/pet-p.git
cd pet-p
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.example apps/backend/.env
```

The defaults in `.env.example` work out-of-the-box with the Docker Compose services. For production, change `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong random strings.

### 4. Start infrastructure (PostgreSQL + Redis)

```bash
docker compose up -d
```

Wait for services to be healthy:

```bash
docker compose ps   # Both should show "healthy"
```

### 5. Run database migrations

```bash
pnpm backend:migrate
```

### 6. Seed the database (optional but recommended)

```bash
pnpm --filter backend prisma:seed
```

This creates demo data including:
- **Super Admin:** `superadmin@pos.dev` / `SuperAdmin@123`
- **Demo Restaurant:** "The Spice Garden" with menu items, tables, and staff users

### 7. Start the backend

```bash
pnpm backend:dev
```

Backend runs at: **http://localhost:3000**
Swagger docs at: **http://localhost:3000/api/docs**

### 8. Start the frontend (new terminal)

```bash
pnpm pos-web:dev
```

Frontend runs at: **http://localhost:5173**

## One-Command Setup Script

For convenience, you can run the entire setup with a single script:

```bash
./setup.sh
```

## Available Scripts

Run from the project root:

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm backend:dev` | Start backend in dev mode |
| `pnpm backend:build` | Build backend for production |
| `pnpm backend:migrate` | Run Prisma migrations |
| `pnpm backend:studio` | Open Prisma Studio (DB GUI) |
| `pnpm pos-web:dev` | Start frontend dev server |
| `pnpm pos-web:build` | Build frontend for production |
| `pnpm docker:up` | Start PostgreSQL & Redis containers |
| `pnpm docker:down` | Stop infrastructure containers |
| `pnpm docker:logs` | Tail infrastructure logs |
| `pnpm --filter backend prisma:seed` | Seed database with demo data |
| `pnpm --filter backend prisma:reset` | Reset DB and re-run migrations |

## Project Structure

```
pet-p/
├── apps/
│   ├── backend/          # NestJS API server
│   │   ├── prisma/       # Schema, migrations, seed
│   │   └── src/          # Modules, controllers, services
│   └── pos-web/          # React + Vite frontend
│       └── src/          # Pages, components, stores
├── packages/
│   └── shared/           # Shared TypeScript types & DTOs
├── docker-compose.yml    # PostgreSQL + Redis
├── .env.example          # Environment variable template
└── pnpm-workspace.yaml   # Monorepo config
```

## Troubleshooting

### Port already in use

```bash
# Kill process on port 3000 (backend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Database connection refused

Make sure Docker containers are running:

```bash
docker compose ps
docker compose up -d   # restart if needed
```

### Prisma Client out of sync

```bash
pnpm --filter backend prisma:generate
```

### Reset everything from scratch

```bash
docker compose down -v           # Remove containers + volumes
docker compose up -d             # Fresh containers
pnpm backend:migrate             # Re-run migrations
pnpm --filter backend prisma:seed  # Re-seed data
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Backend server port |
| `DATABASE_URL` | `postgresql://posuser:pospassword@localhost:5432/posdb` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `JWT_SECRET` | (change me) | Secret for signing access tokens |
| `JWT_EXPIRES_IN` | `15m` | Access token TTL |
| `JWT_REFRESH_SECRET` | (change me) | Secret for signing refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3001` | Allowed CORS origins |
| `SWAGGER_ENABLED` | `true` | Enable Swagger API docs |
