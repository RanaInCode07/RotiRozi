#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────────────────────────────────────
# RotiRozi — Full Project Setup Script
# ─────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() { echo -e "\n${BLUE}[$1/$TOTAL_STEPS]${NC} $2"; }
print_ok()   { echo -e "    ${GREEN}✔${NC} $1"; }
print_warn() { echo -e "    ${YELLOW}⚠${NC} $1"; }
print_err()  { echo -e "    ${RED}✖${NC} $1"; }

TOTAL_STEPS=7

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════╗"
echo "║      RotiRozi — Project Setup Script         ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Check prerequisites
# ─────────────────────────────────────────────────────────────────────────────
print_step 1 "Checking prerequisites..."

MISSING=0

if command -v node &>/dev/null; then
    NODE_VER=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        print_ok "Node.js $NODE_VER"
    else
        print_err "Node.js $NODE_VER found, but >=18 required"
        MISSING=1
    fi
else
    print_err "Node.js not found. Install from https://nodejs.org/"
    MISSING=1
fi

if command -v pnpm &>/dev/null; then
    PNPM_VER=$(pnpm --version)
    PNPM_MAJOR=$(echo "$PNPM_VER" | cut -d. -f1)
    if [ "$PNPM_MAJOR" -ge 8 ]; then
        print_ok "pnpm $PNPM_VER"
    else
        print_err "pnpm $PNPM_VER found, but >=8 required"
        MISSING=1
    fi
else
    print_err "pnpm not found. Install with: npm install -g pnpm"
    MISSING=1
fi

if command -v docker &>/dev/null; then
    DOCKER_VER=$(docker --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
    print_ok "Docker $DOCKER_VER"
else
    print_err "Docker not found. Install from https://docs.docker.com/get-docker/"
    MISSING=1
fi

if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
    COMPOSE_VER=$(docker compose version --short 2>/dev/null || echo "v2+")
    print_ok "Docker Compose $COMPOSE_VER (plugin)"
elif command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
    COMPOSE_VER=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    print_ok "Docker Compose $COMPOSE_VER (standalone)"
else
    print_err "Docker Compose not found."
    print_err "Fix: brew install docker-compose   OR   install Docker Desktop"
    MISSING=1
fi

if [ "$MISSING" -ne 0 ]; then
    echo ""
    print_err "Missing prerequisites. Please install them and re-run this script."
    exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Install dependencies
# ─────────────────────────────────────────────────────────────────────────────
print_step 2 "Installing dependencies with pnpm..."
pnpm install
print_ok "Dependencies installed"

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: Set up environment variables
# ─────────────────────────────────────────────────────────────────────────────
print_step 3 "Setting up environment variables..."

if [ -f apps/backend/.env ]; then
    print_warn "apps/backend/.env already exists — skipping (delete it to regenerate)"
else
    cp .env.example apps/backend/.env
    print_ok "Created apps/backend/.env from .env.example"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 4: Start Docker services (PostgreSQL + Redis)
# ─────────────────────────────────────────────────────────────────────────────
print_step 4 "Starting PostgreSQL and Redis via Docker Compose..."
$COMPOSE_CMD up -d
print_ok "Containers started"

echo "    Waiting for services to be healthy..."
RETRIES=30
while [ $RETRIES -gt 0 ]; do
    PG_HEALTHY=$(docker inspect --format='{{.State.Health.Status}}' pos_postgres 2>/dev/null || echo "starting")
    REDIS_HEALTHY=$(docker inspect --format='{{.State.Health.Status}}' pos_redis 2>/dev/null || echo "starting")

    if [ "$PG_HEALTHY" = "healthy" ] && [ "$REDIS_HEALTHY" = "healthy" ]; then
        break
    fi
    sleep 2
    RETRIES=$((RETRIES - 1))
done

if [ "$PG_HEALTHY" = "healthy" ] && [ "$REDIS_HEALTHY" = "healthy" ]; then
    print_ok "PostgreSQL: healthy"
    print_ok "Redis: healthy"
else
    print_warn "Services may not be ready yet. Check with: docker compose ps"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 5: Run database migrations
# ─────────────────────────────────────────────────────────────────────────────
print_step 5 "Running Prisma migrations..."
pnpm backend:migrate
print_ok "Migrations applied"

# ─────────────────────────────────────────────────────────────────────────────
# Step 6: Generate Prisma Client
# ─────────────────────────────────────────────────────────────────────────────
print_step 6 "Generating Prisma Client..."
pnpm --filter backend prisma:generate
print_ok "Prisma Client generated"

# ─────────────────────────────────────────────────────────────────────────────
# Step 7: Seed the database
# ─────────────────────────────────────────────────────────────────────────────
print_step 7 "Seeding database with demo data..."
pnpm --filter backend prisma:seed
print_ok "Database seeded"

# ─────────────────────────────────────────────────────────────────────────────
# Done!
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Setup complete!                      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Start the backend:   ${YELLOW}pnpm backend:dev${NC}"
echo -e "  Start the frontend:  ${YELLOW}pnpm pos-web:dev${NC}"
echo ""
echo -e "  Backend URL:         ${BLUE}http://localhost:3000${NC}"
echo -e "  Swagger Docs:        ${BLUE}http://localhost:3000/api/docs${NC}"
echo -e "  Frontend URL:        ${BLUE}http://localhost:5173${NC}"
echo ""
echo -e "  Demo login:          ${YELLOW}superadmin@pos.dev${NC} / ${YELLOW}SuperAdmin@123${NC}"
echo ""
