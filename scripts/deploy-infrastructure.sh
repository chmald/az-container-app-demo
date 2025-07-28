#!/bin/bash

# Deploy Azure infrastructure using Bicep templates
# Usage: ./scripts/deploy-infrastructure.sh [RESOURCE_GROUP] [LOCATION]

set -e

RESOURCE_GROUP=${1:-"rg-ecommerce-dev"}
LOCATION=${2:-"West US 3"}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-"YourSecurePassword123!"}

echo "Deploying infrastructure to Resource Group: $RESOURCE_GROUP in $LOCATION"

# Create resource group if it doesn't exist
echo "Creating resource group..."
az group create --name $RESOURCE_GROUP --location "$LOCATION"

# Deploy Bicep template
echo "Deploying Bicep template..."
az deployment group create \
    --resource-group $RESOURCE_GROUP \
    --template-file infrastructure/bicep/main.bicep \
    --parameters infrastructure/bicep/parameters.json \
    --parameters location="$LOCATION" \
    --parameters postgresAdminPassword="$POSTGRES_PASSWORD"

echo "Infrastructure deployment completed!"

# Get deployment outputs
echo ""
echo "Getting deployment outputs..."
ACR_LOGIN_SERVER=$(az deployment group show \
    --resource-group $RESOURCE_GROUP \
    --name main \
    --query properties.outputs.acrLoginServer.value \
    -o tsv)

CONTAINER_APPS_ENV_ID=$(az deployment group show \
    --resource-group $RESOURCE_GROUP \
    --name main \
    --query properties.outputs.containerAppsEnvironmentId.value \
    -o tsv)

echo "Azure Container Registry: $ACR_LOGIN_SERVER"
echo "Container Apps Environment ID: $CONTAINER_APPS_ENV_ID"
echo ""
echo "Export these environment variables for subsequent deployments:"
echo "export ACR_NAME=$(echo $ACR_LOGIN_SERVER | cut -d'.' -f1)"
echo "export CONTAINER_APPS_ENV_ID='$CONTAINER_APPS_ENV_ID'"