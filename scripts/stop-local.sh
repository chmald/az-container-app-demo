#!/bin/bash

# Stop local development environment
# Usage: ./scripts/stop-local.sh

set -e

echo "Stopping Azure Container Apps Demo local development environment..."

# Stop Dapr applications
echo "Stopping Dapr applications..."
dapr stop --app-id order-service || true
dapr stop --app-id inventory-service || true
dapr stop --app-id notification-service || true

# Stop Docker Compose services
echo "Stopping Docker Compose services..."
docker-compose down

# Kill any remaining Node.js, Python, or Go processes related to our services
echo "Cleaning up remaining processes..."
pkill -f "npm start" || true
pkill -f "python main.py" || true
pkill -f "go run main.go" || true

echo "✅ All services stopped successfully!"