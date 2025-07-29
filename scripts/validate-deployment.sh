#!/bin/bash

# Validate Azure Container Apps Deployment
# This script helps verify that your application containers are properly deployed

set -e

ENVIRONMENT_NAME=${1:-$AZURE_ENV_NAME}

if [ -z "$ENVIRONMENT_NAME" ]; then
    echo "❌ Environment name not provided. Set AZURE_ENV_NAME or pass as first argument"
    exit 1
fi

echo "🔍 Validating deployment for environment: $ENVIRONMENT_NAME"

# Get azd environment info
echo ""
echo "📋 Getting deployment info..."
ENV_JSON=$(azd env get-values --output json)

if [ $? -ne 0 ] || [ -z "$ENV_JSON" ]; then
    echo "❌ Could not get environment info. Make sure you're in the right directory and environment is set."
    exit 1
fi

# Extract service URLs using jq or basic parsing
if command -v jq &> /dev/null; then
    FRONTEND_URL=$(echo "$ENV_JSON" | jq -r '.SERVICE_FRONTEND_ENDPOINT_URL // empty')
    ORDER_URL=$(echo "$ENV_JSON" | jq -r '.SERVICE_ORDER_SERVICE_ENDPOINT_URL // empty')
    INVENTORY_URL=$(echo "$ENV_JSON" | jq -r '.SERVICE_INVENTORY_SERVICE_ENDPOINT_URL // empty')
    NOTIFICATION_URL=$(echo "$ENV_JSON" | jq -r '.SERVICE_NOTIFICATION_SERVICE_ENDPOINT_URL // empty')
    ACR_NAME=$(echo "$ENV_JSON" | jq -r '.AZURE_CONTAINER_REGISTRY_NAME // empty')
else
    # Fallback parsing without jq
    FRONTEND_URL=$(echo "$ENV_JSON" | grep -o '"SERVICE_FRONTEND_ENDPOINT_URL"[^,]*' | cut -d'"' -f4)
    ORDER_URL=$(echo "$ENV_JSON" | grep -o '"SERVICE_ORDER_SERVICE_ENDPOINT_URL"[^,]*' | cut -d'"' -f4)
    INVENTORY_URL=$(echo "$ENV_JSON" | grep -o '"SERVICE_INVENTORY_SERVICE_ENDPOINT_URL"[^,]*' | cut -d'"' -f4)
    NOTIFICATION_URL=$(echo "$ENV_JSON" | grep -o '"SERVICE_NOTIFICATION_SERVICE_ENDPOINT_URL"[^,]*' | cut -d'"' -f4)
    ACR_NAME=$(echo "$ENV_JSON" | grep -o '"AZURE_CONTAINER_REGISTRY_NAME"[^,]*' | cut -d'"' -f4)
fi

echo ""
echo "🌐 Service URLs:"
echo "Frontend: $FRONTEND_URL"
echo "Order Service: $ORDER_URL"
echo "Inventory Service: $INVENTORY_URL"
echo "Notification Service: $NOTIFICATION_URL"

# Test frontend
echo ""
echo "🧪 Testing Frontend..."
if curl -s -I "$FRONTEND_URL" --max-time 10 | grep -q "200 OK"; then
    CONTENT_TYPE=$(curl -s -I "$FRONTEND_URL" --max-time 10 | grep -i "content-type" | cut -d' ' -f2-)
    if echo "$CONTENT_TYPE" | grep -q "text/html"; then
        echo "✅ Frontend is responding with HTML"
    else
        echo "⚠️  Frontend responded but not with HTML content"
    fi
else
    echo "❌ Frontend is not responding"
fi

# Test APIs
declare -a apis=(
    "Order Service:$ORDER_URL/health"
    "Inventory Service:$INVENTORY_URL/health"
    "Notification Service:$NOTIFICATION_URL/health"
)

for api in "${apis[@]}"; do
    IFS=':' read -r name url <<< "$api"
    echo ""
    echo "🧪 Testing $name..."
    
    if curl -s -I "$url" --max-time 10 | grep -q "200 OK"; then
        CONTENT_TYPE=$(curl -s -I "$url" --max-time 10 | grep -i "content-type" | cut -d' ' -f2-)
        if echo "$CONTENT_TYPE" | grep -q "application/json"; then
            echo "✅ $name is responding with JSON"
        else
            echo "⚠️  $name responded but not with JSON (might be placeholder)"
            echo "   Content-Type: $CONTENT_TYPE"
        fi
    else
        echo "❌ $name is not responding"
    fi
done

# Check container registry for custom images
echo ""
echo "🐳 Checking Container Registry..."
if [ -n "$ACR_NAME" ]; then
    if command -v az &> /dev/null; then
        REPOS=$(az acr repository list --name "$ACR_NAME" --output json 2>/dev/null || echo "[]")
        if [ "$REPOS" != "[]" ]; then
            echo "Found repositories: $(echo "$REPOS" | tr -d '[]"' | sed 's/,/, /g')"
            
            # Check for expected repositories
            EXPECTED_REPOS=("frontend" "backend-service")
            MISSING_REPOS=()
            
            for repo in "${EXPECTED_REPOS[@]}"; do
                if ! echo "$REPOS" | grep -q "\"$repo\""; then
                    MISSING_REPOS+=("$repo")
                fi
            done
            
            if [ ${#MISSING_REPOS[@]} -eq 0 ]; then
                echo "✅ All expected container images found in registry"
            else
                echo "⚠️  Missing container images: ${MISSING_REPOS[*]}"
                echo "   This indicates the applications weren't built/pushed properly"
            fi
        else
            echo "⚠️  No repositories found in container registry"
        fi
    else
        echo "⚠️  Azure CLI not available to check container registry"
    fi
else
    echo "⚠️  Container registry name not found in environment"
fi

echo ""
echo "📊 Validation Summary:"
echo "If you see ⚠️ or ❌ indicators above, try running:"
echo "  azd deploy                    # Redeploy application containers"
echo "  azd logs --follow            # Check for build/deployment errors"
echo "  azd down && azd up           # Full redeployment (if needed)"
