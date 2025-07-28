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

# Call the existing build script
./scripts/build-and-push.sh $AZURE_CONTAINER_REGISTRY_NAME latest

echo "Container images built and pushed successfully!"
