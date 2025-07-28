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

# Start Order Service with Dapr
echo "Starting Order Service..."
cd src/order-service
npm install
dapr run \
    --app-id order-service \
    --app-port 3001 \
    --dapr-http-port 3501 \
    --dapr-grpc-port 50001 \
    --components-path ../../infrastructure/dapr/components \
    --config ../../infrastructure/dapr/configuration/config.yaml \
    npm start &

cd ../..

# Start Inventory Service with Dapr
echo "Starting Inventory Service..."
cd src/inventory-service
pip install -r requirements.txt
dapr run \
    --app-id inventory-service \
    --app-port 8000 \
    --dapr-http-port 3502 \
    --dapr-grpc-port 50002 \
    --components-path ../../infrastructure/dapr/components \
    --config ../../infrastructure/dapr/configuration/config.yaml \
    python main.py &

cd ../..

# Start Notification Service with Dapr
echo "Starting Notification Service..."
cd src/notification-service
go mod tidy
dapr run \
    --app-id notification-service \
    --app-port 8080 \
    --dapr-http-port 3503 \
    --dapr-grpc-port 50003 \
    --components-path ../../infrastructure/dapr/components \
    --config ../../infrastructure/dapr/configuration/config.yaml \
    go run main.go &

cd ../..

# Start Frontend
echo "Starting Frontend..."
cd src/frontend
npm install
npm start &

cd ../..

echo ""
echo "🚀 All services started successfully!"
echo ""
echo "Services running on:"
echo "  Frontend:          http://localhost:3000"
echo "  Order Service:     http://localhost:3001 (Dapr: http://localhost:3501)"
echo "  Inventory Service: http://localhost:8000 (Dapr: http://localhost:3502)"
echo "  Notification Svc:  http://localhost:8080 (Dapr: http://localhost:3503)"
echo "  PostgreSQL:        localhost:5432"
echo "  Redis:             localhost:6379"
echo ""
echo "API Documentation:"
echo "  Order Service:     http://localhost:3001/api-docs"
echo "  Inventory Service: http://localhost:8000/api/docs"
echo ""
echo "To stop all services, run: ./scripts/stop-local.sh"
echo "To view logs, run: dapr logs --app-id <service-name>"