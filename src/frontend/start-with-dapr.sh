#!/bin/bash

# Start frontend with Dapr sidecar for local development

echo "Starting frontend with Dapr sidecar..."

# Check if Dapr is installed
if ! command -v dapr &> /dev/null; then
    echo "Error: Dapr CLI is not installed. Please install it first:"
    echo "https://docs.dapr.io/getting-started/install-dapr-cli/"
    exit 1
fi

# Build React app first
echo "Building React app..."
npm run build

# Start frontend server with Dapr
echo "Starting frontend server with Dapr..."
cd server
npm install

cd ..
dapr run \
    --app-id frontend \
    --app-port 3000 \
    --dapr-http-port 3500 \
    --dapr-grpc-port 50001 \
    --components-path ../../infra/dapr/components \
    --config ../../infra/dapr/configuration/config.yaml \
    node server/server.js
