#!/bin/bash

# Build and push all container images to Azure Container Registry
# Usage: ./scripts/build-and-push.sh [ACR_NAME]

set -e

ACR_NAME=${1:-$ACR_NAME}
if [ -z "$ACR_NAME" ]; then
    echo "Error: ACR_NAME is required"
    echo "Usage: $0 <ACR_NAME>"
    echo "Or set ACR_NAME environment variable"
    exit 1
fi

TAG=${2:-latest}

echo "Building and pushing images to ${ACR_NAME}.azurecr.io with tag: ${TAG}"

# Login to ACR
echo "Logging in to Azure Container Registry..."
az acr login --name $ACR_NAME

# Build and push Frontend
echo "Building Frontend..."
cd src/frontend
docker build -t ${ACR_NAME}.azurecr.io/frontend:${TAG} .
echo "Pushing Frontend..."
docker push ${ACR_NAME}.azurecr.io/frontend:${TAG}
cd ../..

# Build and push Order Service
echo "Building Order Service..."
cd src/order-service
docker build -t ${ACR_NAME}.azurecr.io/order-service:${TAG} .
echo "Pushing Order Service..."
docker push ${ACR_NAME}.azurecr.io/order-service:${TAG}
cd ../..

# Build and push Inventory Service
echo "Building Inventory Service..."
cd src/inventory-service
docker build -t ${ACR_NAME}.azurecr.io/inventory-service:${TAG} .
echo "Pushing Inventory Service..."
docker push ${ACR_NAME}.azurecr.io/inventory-service:${TAG}
cd ../..

# Build and push Notification Service
echo "Building Notification Service..."
cd src/notification-service
docker build -t ${ACR_NAME}.azurecr.io/notification-service:${TAG} .
echo "Pushing Notification Service..."
docker push ${ACR_NAME}.azurecr.io/notification-service:${TAG}
cd ../..

echo "All images built and pushed successfully!"
echo ""
echo "Images pushed:"
echo "  ${ACR_NAME}.azurecr.io/frontend:${TAG}"
echo "  ${ACR_NAME}.azurecr.io/order-service:${TAG}"
echo "  ${ACR_NAME}.azurecr.io/inventory-service:${TAG}"
echo "  ${ACR_NAME}.azurecr.io/notification-service:${TAG}"