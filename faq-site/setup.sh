#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "=========================================="
echo "  QuoraFAQ — One-Click Setup"
echo "=========================================="
echo ""

# --- Auto-detect container runtime ---
ENGINE=""
COMPOSE=""

if command -v docker &> /dev/null && docker info &>/dev/null 2>&1; then
  ENGINE="docker"
  COMPOSE="docker compose"
elif command -v podman &> /dev/null; then
  ENGINE="podman"
  if podman compose version &>/dev/null; then
    COMPOSE="podman compose"
  elif command -v podman-compose &> /dev/null; then
    COMPOSE="podman-compose"
  else
    echo "Error: Neither 'podman compose' nor 'podman-compose' found."
    echo "Install podman-compose: pip install podman-compose"
    exit 1
  fi
else
  echo "Error: No container runtime found."
  echo "Install Docker (https://docker.com) or Podman (https://podman.io)"
  exit 1
fi

echo "Engine: $(docker --version 2>/dev/null || podman --version 2>/dev/null || podman version 2>&1 | head -1)"
echo "Mode:   $ENGINE / $COMPOSE"
echo ""

# --- Check ports (Linux ss / macOS lsof) ---
check_port() {
  local port=$1 name=$2 pid=""
  if command -v ss &>/dev/null; then
    if ss -tlnp "sport = :$port" 2>/dev/null | grep -q .; then
      pid=$(ss -tlnp "sport = :$port" 2>/dev/null | sed -n 's/.*pid=\([0-9]*\).*/\1/p')
    fi
  elif command -v lsof &>/dev/null; then
    pid=$(lsof -ti :"$port" 2>/dev/null || true)
  fi
  if [ -n "$pid" ]; then
    echo "Warning: Port $port ($name) is already in use by PID $pid."
    read -rp "  Kill the existing process and continue? [y/N] " ans
    if [[ "$ans" =~ ^[yY] ]]; then
      kill "$pid" 2>/dev/null && echo "  Killed PID $pid." || echo "  Could not kill process."
      sleep 1
    else
      echo "Exiting. Free port $port and try again."
      exit 1
    fi
  fi
}
check_port 5000 "backend"
check_port 3000 "frontend"

# --- Pull images upfront (shows progress) ---
echo "Pulling container images..."
$COMPOSE pull 2>/dev/null || true
echo ""

# --- Build and start ---
echo "Building and starting all services..."
echo ""
echo "  Backend  -> http://localhost:5000"
echo "  Frontend -> http://localhost:3000"
echo ""
echo "  Admin login: admin@quorafaq.com / admin123"
echo ""
echo "Initial startup may take 2-3 minutes."
echo "=========================================="
echo ""

$COMPOSE up -d --build

echo ""
echo "Waiting for backend to be ready..."
for i in $(seq 1 60); do
  if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "Ready after ${i}s."
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "Timed out waiting for backend. Check logs: $COMPOSE logs backend"
    exit 1
  fi
  sleep 2
done

echo ""
echo "=========================================="
echo "  All services are up!"
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo "=========================================="
echo ""
echo "To stop:    $COMPOSE down"
echo "To reset:   $COMPOSE down -v && ./setup.sh"
echo "To view logs: $COMPOSE logs -f"
echo "To follow backend: $COMPOSE logs -f backend"
