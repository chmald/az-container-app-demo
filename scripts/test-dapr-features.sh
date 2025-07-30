#!/bin/bash

# Dapr Functionality Test Script
# This script tests various Dapr features implemented in the application

BASE_URL="${BASE_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "🧪 Testing Dapr Features in az-container-app-demo"
echo "=================================================="
echo "Backend Service: $BASE_URL"
echo "Frontend Service: $FRONTEND_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to make HTTP requests and check responses
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -e "${BLUE}Testing:${NC} $description"
    echo -e "${YELLOW}$method${NC} $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ FAIL${NC} (Expected HTTP $expected_status, got HTTP $http_code)"
        echo "$body"
    fi
    echo ""
}

echo "🏥 1. Health Checks"
echo "==================="

test_endpoint "GET" "/health" "" 200 "Application Health Check"
test_endpoint "GET" "/dapr/service/health" "" 200 "Dapr Service Health Check"
test_endpoint "GET" "/dapr/service/dapr-metadata" "" 200 "Dapr Metadata"

echo "📊 2. State Management Tests"
echo "============================="

# Test getting initial inventory (should load from state store or initialize)
test_endpoint "GET" "/api/inventory" "" 200 "Get Inventory (State Store Test)"

# Test getting orders (should load from state store if available)
test_endpoint "GET" "/api/orders" "" 200 "Get Orders (State Store Test)"

# Test creating a new order (will save to state store and publish events)
ORDER_DATA='{
  "customerId": "test-customer-001",
  "items": [
    {
      "productId": "product-001",
      "quantity": 1
    }
  ]
}'

test_endpoint "POST" "/api/orders" "$ORDER_DATA" 201 "Create Order (State Store + Pub/Sub Test)"

echo "📬 3. Pub/Sub Tests"
echo "==================="

# The order creation above should have published events
# Let's check the Dapr subscription endpoint
test_endpoint "GET" "/dapr/subscribe" "" 200 "Dapr Subscriptions Endpoint"

# Create another order with different data to trigger more events
ORDER_DATA2='{
  "customerId": "test-customer-002",
  "items": [
    {
      "productId": "product-004",
      "quantity": 3
    }
  ]
}'

test_endpoint "POST" "/api/orders" "$ORDER_DATA2" 201 "Create Order 2 (Should trigger inventory alert)"

echo "🔄 4. Service Invocation Tests"
echo "==============================="

# Test service invocation endpoint
INVOKE_DATA='{
  "message": "Test notification",
  "recipient": "test@example.com",
  "type": "email"
}'

test_endpoint "POST" "/dapr/service/notify" "$INVOKE_DATA" 200 "Service Invocation - Notify"

# Test invoking self (for demo purposes)
SELF_INVOKE_DATA='{
  "targetAppId": "backend-service",
  "method": "service/health",
  "data": {}
}'

test_endpoint "POST" "/dapr/service/invoke-test" "$SELF_INVOKE_DATA" 200 "Service Invocation - Self Test"

echo "📦 5. Inventory State Management"
echo "================================="

# Test updating inventory (should trigger pub/sub if low stock)
test_endpoint "PUT" "/api/inventory/product-004" '{"quantity": 5}' 200 "Update Inventory (Low Stock Alert Test)"

# Get specific product to verify state update
test_endpoint "GET" "/api/inventory/product-004" "" 200 "Get Updated Product"

echo "🔔 6. Notification System"
echo "=========================="

# Test direct notification creation
NOTIFICATION_DATA='{
  "type": "EMAIL",
  "recipient": "test@example.com",
  "subject": "Test Notification",
  "message": "This is a test notification via Dapr"
}'

test_endpoint "POST" "/api/notifications" "$NOTIFICATION_DATA" 201 "Create Direct Notification"

echo "📋 7. Complete System Test"
echo "==========================="

# Create an order that should trigger the complete flow:
# 1. Save order to state store
# 2. Update inventory in state store  
# 3. Publish order-created event
# 4. Potentially publish inventory-alert event
# 5. Notification service handles events

COMPLETE_TEST_ORDER='{
  "customerId": "integration-test-customer",
  "items": [
    {
      "productId": "product-002",
      "quantity": 2
    },
    {
      "productId": "product-003", 
      "quantity": 1
    }
  ]
}'

test_endpoint "POST" "/api/orders" "$COMPLETE_TEST_ORDER" 201 "Complete Integration Test Order"

# Verify the order was saved by retrieving it
echo "Waiting 2 seconds for async processing..."
sleep 2

test_endpoint "GET" "/api/orders" "" 200 "Verify Orders After Integration Test"

echo "🎉 Dapr Feature Testing Complete!"
echo "=================================="
echo ""
echo "ℹ️  Additional verification steps:"
echo "   - Check application logs for Dapr state store operations"
echo "   - Check application logs for pub/sub event publishing/receiving"  
echo "   - Verify Redis cache contains the saved state data"
echo "   - Monitor notification processing in the logs"
echo ""
echo "📝 To run this test:"
echo "   chmod +x test-dapr-features.sh"
echo "   ./test-dapr-features.sh"
echo ""
echo "🔧 To run with custom URLs:"
echo "   BASE_URL=https://your-backend-url ./test-dapr-features.sh"
