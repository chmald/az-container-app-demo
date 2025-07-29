#!/bin/bash

# Pre-deployment hook for Azure Developer CLI
# This script builds and pushes all container images

set -e

echo "Building and pushing container images..."

# Get the ACR name from azd environment
if [ -z "$AZURE_CONTAINER_REGISTRY_NAME" ]; then
    echo "Error: AZURE_CONTAINER_REGISTRY_NAME environment variable not set"
    exit 1
fi

echo "Container registry: $AZURE_CONTAINER_REGISTRY_NAME"

# Azure Developer CLI will handle the actual image building and pushing
# This script is run as part of the azd deployment process
echo "Azure Developer CLI will build and push container images automatically during deployment"

echo "Pre-deployment tasks completed successfully!"
