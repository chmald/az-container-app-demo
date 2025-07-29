#!/bin/bash

# Start local development environment with Docker Compose and Dapr
# Usage: ./scripts/start-local.sh

set -e

echo "Starting Azure Container Apps Demo in local development mode..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Dapr CLI is installed
if ! command -v dapr &> /dev/null; then
    echo "Dapr CLI not found. Installing Dapr CLI..."
    
    # Install Dapr CLI
    wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash
    
    # Initialize Dapr
    echo "Initializing Dapr..."
    dapr init
fi

# Start services with Docker Compose
echo "Starting services with Docker Compose..."
docker-compose up -d postgres redis

# Wait for databases to be ready
echo "Waiting for databases to be ready..."
sleep 10

# Start Dapr applications
echo "Starting Dapr applications..."

# Start Backend Service with Dapr
echo "Starting Backend Service..."
cd src/backend-service
npm install
dapr run \
    --app-id backend-service \
    --app-port 3001 \
    --dapr-http-port 3501 \
    --dapr-grpc-port 50001 \
    --components-path ../../infra/dapr/components \
    --config ../../infra/dapr/configuration/config.yaml \
    npm start &

cd ../..

# Start Frontend
echo "Starting Frontend..."
cd src/frontend
npm install
npm start &

cd ../..

echo ""
echo "All services started successfully!"
echo ""
echo "Services running on:"
echo "  Frontend:         http://localhost:3000"
echo "  Backend Service:  http://localhost:3001 (Dapr: http://localhost:3501)"
echo "  PostgreSQL:       localhost:5432"
echo "  Redis:            localhost:6379"
echo ""
echo "API Documentation:"
echo "  Backend Service:  http://localhost:3001/api-docs"
echo ""
echo "To stop all services, run: ./scripts/stop-local.sh"
echo "To view logs, run: dapr logs --app-id backend-service"