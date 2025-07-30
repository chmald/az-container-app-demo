@echo off
REM Dapr Functionality Test Script for Windows
REM This script tests various Dapr features implemented in the application

if "%BASE_URL%"=="" set BASE_URL=http://localhost:3001
if "%FRONTEND_URL%"=="" set FRONTEND_URL=http://localhost:3000

echo 🧪 Testing Dapr Features in az-container-app-demo
echo ==================================================
echo Backend Service: %BASE_URL%
echo Frontend Service: %FRONTEND_URL%
echo.

echo 🏥 1. Health Checks
echo ===================

echo Testing: Application Health Check
curl -s "%BASE_URL%/health"
echo.
echo.

echo Testing: Dapr Service Health Check  
curl -s "%BASE_URL%/dapr/service/health"
echo.
echo.

echo Testing: Dapr Metadata
curl -s "%BASE_URL%/dapr/service/dapr-metadata"
echo.
echo.

echo 📊 2. State Management Tests
echo =============================

echo Testing: Get Inventory (State Store Test)
curl -s "%BASE_URL%/api/inventory"
echo.
echo.

echo Testing: Get Orders (State Store Test)
curl -s "%BASE_URL%/api/orders"
echo.
echo.

echo Testing: Create Order (State Store + Pub/Sub Test)
curl -s -X POST "%BASE_URL%/api/orders" ^
  -H "Content-Type: application/json" ^
  -d "{\"customerId\": \"test-customer-001\", \"items\": [{\"productId\": \"product-001\", \"quantity\": 1}]}"
echo.
echo.

echo 📬 3. Pub/Sub Tests
echo ===================

echo Testing: Dapr Subscriptions Endpoint
curl -s "%BASE_URL%/dapr/subscribe"
echo.
echo.

echo Testing: Create Order 2 (Should trigger inventory alert)
curl -s -X POST "%BASE_URL%/api/orders" ^
  -H "Content-Type: application/json" ^
  -d "{\"customerId\": \"test-customer-002\", \"items\": [{\"productId\": \"product-004\", \"quantity\": 3}]}"
echo.
echo.

echo 🔄 4. Service Invocation Tests
echo ===============================

echo Testing: Service Invocation - Notify
curl -s -X POST "%BASE_URL%/dapr/service/notify" ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"Test notification\", \"recipient\": \"test@example.com\", \"type\": \"email\"}"
echo.
echo.

echo Testing: Service Invocation - Self Test
curl -s -X POST "%BASE_URL%/dapr/service/invoke-test" ^
  -H "Content-Type: application/json" ^
  -d "{\"targetAppId\": \"backend-service\", \"method\": \"service/health\", \"data\": {}}"
echo.
echo.

echo 📦 5. Inventory State Management
echo =================================

echo Testing: Update Inventory (Low Stock Alert Test)
curl -s -X PUT "%BASE_URL%/api/inventory/product-004" ^
  -H "Content-Type: application/json" ^
  -d "{\"quantity\": 5}"
echo.
echo.

echo Testing: Get Updated Product
curl -s "%BASE_URL%/api/inventory/product-004"
echo.
echo.

echo 🔔 6. Notification System
echo ==========================

echo Testing: Create Direct Notification
curl -s -X POST "%BASE_URL%/api/notifications" ^
  -H "Content-Type: application/json" ^
  -d "{\"type\": \"EMAIL\", \"recipient\": \"test@example.com\", \"subject\": \"Test Notification\", \"message\": \"This is a test notification via Dapr\"}"
echo.
echo.

echo 📋 7. Complete System Test
echo ===========================

echo Testing: Complete Integration Test Order
curl -s -X POST "%BASE_URL%/api/orders" ^
  -H "Content-Type: application/json" ^
  -d "{\"customerId\": \"integration-test-customer\", \"items\": [{\"productId\": \"product-002\", \"quantity\": 2}, {\"productId\": \"product-003\", \"quantity\": 1}]}"
echo.
echo.

echo Waiting 2 seconds for async processing...
timeout /t 2 /nobreak > nul

echo Testing: Verify Orders After Integration Test
curl -s "%BASE_URL%/api/orders"
echo.
echo.

echo 🎉 Dapr Feature Testing Complete!
echo ==================================
echo.
echo ℹ️  Additional verification steps:
echo    - Check application logs for Dapr state store operations
echo    - Check application logs for pub/sub event publishing/receiving  
echo    - Verify Redis cache contains the saved state data
echo    - Monitor notification processing in the logs
echo.
echo 📝 To run this test:
echo    test-dapr-features.bat
echo.
echo 🔧 To run with custom URLs:
echo    set BASE_URL=https://your-backend-url
echo    test-dapr-features.bat
