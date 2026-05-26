#!/bin/bash
# QuoraFAQ Podman Compose Deployment
set -e

if command -v podman-compose &> /dev/null; then
    echo "Using podman-compose..."
    podman-compose -f docker-compose.yml up -d --build
elif command -v podman &> /dev/null && podman plugin ls 2>/dev/null | grep -q compose; then
    echo "Using podman compose..."
    podman compose -f docker-compose.yml up -d --build
else
    echo "podman-compose not found. Using individual deployment script..."
    echo "Install podman-compose: pip install podman-compose"
    echo ""
    echo "Alternatively, run: bash deploy.sh"
    exit 1
fi

echo ""
echo "QuoraFAQ deployed! Access at http://localhost"
