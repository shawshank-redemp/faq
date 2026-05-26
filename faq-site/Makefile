.PHONY: help build dev seed up down logs clean reset verify

# Auto-detect container runtime
ENGINE := docker
ifneq ($(shell command -v podman 2>/dev/null),)
    ENGINE := podman
endif

# Auto-detect compose command
COMPOSE := $(ENGINE) compose
ifeq ($(ENGINE),podman)
    ifneq ($(shell command -v podman-compose 2>/dev/null),)
        COMPOSE := podman-compose
    endif
endif

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Install dependencies locally (needs Node.js 20.18.0, MongoDB, Redis)
	cd backend && npm ci
	cd frontend && npm ci

dev: ## Run locally with hot-reload (needs Node.js 20.18.0, MongoDB, Redis)
	@echo "Starting backend (port 5000) and frontend (port 3000)..."
	cd backend && npm run dev & cd frontend && npm run dev & wait

seed: ## Seed database locally
	cd backend && npm run seed

up: ## Build and start all services with $(ENGINE)
	$(COMPOSE) up -d --build

down: ## Stop all services
	$(COMPOSE) down

logs: ## View logs from all services
	$(COMPOSE) logs -f

clean: ## Stop and remove all containers and volumes
	$(COMPOSE) down -v 2>/dev/null || true

reset: clean ## Full reset — wipes volumes and rebuilds
	$(COMPOSE) build --no-cache 2>/dev/null || true
	$(COMPOSE) up -d

check-integ: ## Verify integrity of seed data
	@sha256sum -c .integrity

verify: check-integ ## Verify reproducibility — checks node version, lockfiles, image tags
	@echo "=== Reproducibility Check ==="
	@echo -n "Node.js version: "; node --version 2>/dev/null || echo "not found"
	@echo -n ".nvmrc: "; cat .nvmrc
	@echo "--- Checking lockfiles ---"
	@test -f backend/package-lock.json && echo "  backend lockfile: OK" || echo "  backend lockfile: MISSING"
	@test -f frontend/package-lock.json && echo "  frontend lockfile: OK" || echo "  frontend lockfile: MISSING"
	@echo "--- Checking pinned images ---"
	@grep -n 'image:' docker-compose.yml | head -20
	@echo "--- Checking npm ci usage ---"
	@grep -rn 'npm ci\|npm install' backend/Dockerfile backend/Dockerfile.dev frontend/Dockerfile frontend/Dockerfile.dev 2>/dev/null
	@echo "=== Check complete ==="

prod-up: ## Build and start production services with $(ENGINE) (from podman/)
	$(COMPOSE) -f podman/docker-compose.yml up -d --build

prod-down: ## Stop production services
	$(COMPOSE) -f podman/docker-compose.yml down

prod-logs: ## View production logs
	$(COMPOSE) -f podman/docker-compose.yml logs -f
