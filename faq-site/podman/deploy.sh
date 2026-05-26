#!/bin/bash
# QuoraFAQ Podman Deployment Script
set -e

echo "====================================="
echo "  QuoraFAQ Podman Deployment"
echo "====================================="

# Check for Podman
if ! command -v podman &> /dev/null; then
    echo "Error: Podman is not installed."
    exit 1
fi

echo "Using Podman version: $(podman --version)"

# Create pod with shared network
echo "Creating pod..."
podman pod create \
    --name quorafaq \
    --publish 8080:80 \
    --publish 5000:5000 \
    --publish 27017:27017 \
    --publish 6379:6379 \
    --publish 9200:9200 \
    --network bridge

# MongoDB
echo "Starting MongoDB..."
podman run -d --pod quorafaq \
    --name quorafaq-mongodb \
    --label "io.podman.compose.project=quorafaq" \
    -v quorafaq-mongodb:/data/db \
    docker.io/mongo:7.0.14

# Redis
echo "Starting Redis..."
podman run -d --pod quorafaq \
    --name quorafaq-redis \
    --label "io.podman.compose.project=quorafaq" \
    -v quorafaq-redis:/data \
    docker.io/redis:7.2.5-alpine3.20

# Elasticsearch
echo "Starting Elasticsearch..."
podman run -d --pod quorafaq \
    --name quorafaq-elasticsearch \
    --label "io.podman.compose.project=quorafaq" \
    -e "discovery.type=single-node" \
    -e "xpack.security.enabled=false" \
    -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
    -v quorafaq-elasticsearch:/usr/share/elasticsearch/data \
    docker.io/elasticsearch:8.11.0

# Build backend image
echo "Building backend image..."
podman build -t quorafaq-backend:latest ../backend

# Backend
echo "Starting backend..."
podman run -d --pod quorafaq \
    --name quorafaq-backend \
    --label "io.podman.compose.project=quorafaq" \
    -e NODE_ENV=production \
    -e PORT=5000 \
    -e MONGODB_URI=mongodb://localhost:27017/quorafaq \
    -e REDIS_URL=redis://localhost:6379 \
    -e ELASTICSEARCH_URL=http://localhost:9200 \
    -e JWT_SECRET="${JWT_SECRET:-quorafaq_jwt_secret_production}" \
    -e JWT_EXPIRES_IN=7d \
    -e CLIENT_URL=http://localhost:8080 \
    quorafaq-backend:latest

# Build frontend image
echo "Building frontend image..."
podman build -t quorafaq-frontend:latest ../frontend

# Frontend
echo "Starting frontend..."
podman run -d --pod quorafaq \
    --name quorafaq-frontend \
    --label "io.podman.compose.project=quorafaq" \
    -e NEXT_PUBLIC_API_URL=http://localhost:5000/api \
    -e NEXT_PUBLIC_SOCKET_URL=http://localhost:5000 \
    quorafaq-frontend:latest

# Build nginx image
echo "Building nginx image..."
podman build -t quorafaq-nginx:latest ../nginx

# Nginx
echo "Starting nginx..."
podman run -d --pod quorafaq \
    --name quorafaq-nginx \
    --label "io.podman.compose.project=quorafaq" \
    quorafaq-nginx:latest

echo ""
echo "====================================="
echo "  QuoraFAQ deployed successfully!"
echo "  Access: http://localhost"
echo "====================================="
echo ""
echo "To stop all containers:"
echo "  podman pod stop quorafaq"
echo ""
echo "To remove all containers:"
echo "  podman pod rm quorafaq"
echo ""
echo "To view logs:"
echo "  podman logs -f quorafaq-backend"
