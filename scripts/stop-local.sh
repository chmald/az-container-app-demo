#!/bin/bash

# Stop local development environment
# Usage: ./scripts/stop-local.sh

set -e

echo "Stopping Azure Container Apps Demo local development environment..."

# Stop Dapr applications
echo "Stopping Dapr applications..."
dapr stop --app-id backend-service || true
dapr stop --app-id frontend || true

# Stop Docker Compose services
echo "Stopping Docker Compose services..."
docker-compose down

# Kill any remaining Node.js processes related to our services
echo "Cleaning up remaining processes..."
pkill -f "npm start" || true

echo "✅ All services stopped successfully!"