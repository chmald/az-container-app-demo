@echo off
REM Validate that all local services are running correctly
REM Usage: scripts\validate-local.bat

setlocal enabledelayedexpansion

echo Validating Azure Container Apps Demo local development environment...
echo.

set "ALL_HEALTHY=true"

REM Function to check HTTP endpoint
:check_endpoint
set "url=%~1"
set "name=%~2"
echo Checking %name%...

curl -s -f -m 10 "%url%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [OK] %name% is healthy
) else (
    echo   [FAIL] %name% is not responding
    set "ALL_HEALTHY=false"
)
goto :eof

REM Check infrastructure services
echo Checking infrastructure services:
docker ps --format "table {{.Names}}\t{{.Status}}" --filter "name=ecommerce-postgres" | findstr "Up" >nul
if %ERRORLEVEL% EQU 0 (
    echo   [OK] PostgreSQL is running
) else (
    echo   [FAIL] PostgreSQL is not running
    set "ALL_HEALTHY=false"
)

docker ps --format "table {{.Names}}\t{{.Status}}" --filter "name=ecommerce-redis" | findstr "Up" >nul
if %ERRORLEVEL% EQU 0 (
    echo   [OK] Redis is running
) else (
    echo   [FAIL] Redis is not running
    set "ALL_HEALTHY=false"
)

echo.
echo Checking application services:

REM Check application endpoints
call :check_endpoint "http://localhost:3000" "Frontend"
call :check_endpoint "http://localhost:3001/health" "Order Service"
call :check_endpoint "http://localhost:8000/health" "Inventory Service"
call :check_endpoint "http://localhost:8080/health" "Notification Service"

echo.
echo Checking Dapr sidecars:

REM Check Dapr sidecars
call :check_endpoint "http://localhost:3500/v1.0/healthz" "Frontend Dapr Sidecar"
call :check_endpoint "http://localhost:3501/v1.0/healthz" "Order Service Dapr Sidecar"
call :check_endpoint "http://localhost:3502/v1.0/healthz" "Inventory Service Dapr Sidecar"
call :check_endpoint "http://localhost:3503/v1.0/healthz" "Notification Service Dapr Sidecar"

echo.
echo Checking Dapr service discovery:

REM Check if services can discover each other through Dapr
curl -s -f -m 10 "http://localhost:3501/v1.0/invoke/inventory-service/method/health" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [OK] Order Service can communicate with Inventory Service via Dapr
) else (
    echo   [FAIL] Order Service cannot communicate with Inventory Service via Dapr
    set "ALL_HEALTHY=false"
)

curl -s -f -m 10 "http://localhost:3502/v1.0/invoke/notification-service/method/health" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [OK] Inventory Service can communicate with Notification Service via Dapr
) else (
    echo   [FAIL] Inventory Service cannot communicate with Notification Service via Dapr
    set "ALL_HEALTHY=false"
)

echo.
echo ======================================================================

if "%ALL_HEALTHY%"=="true" (
    echo All services are healthy and running correctly!
    echo.
    echo You can access:
    echo   Frontend:          http://localhost:3000
    echo   Order Service:     http://localhost:3001
    echo   Inventory Service: http://localhost:8000
    echo   Notification Svc:  http://localhost:8080
    echo.
    echo API Documentation:
    echo   Order Service:     http://localhost:3001/api-docs
    echo   Inventory Service: http://localhost:8000/api/docs
) else (
    echo Some services are not healthy. Please check the logs:
    echo   dapr logs --app-id frontend
    echo   dapr logs --app-id order-service
    echo   dapr logs --app-id inventory-service
    echo   dapr logs --app-id notification-service
    echo.
    echo Or check Docker logs:
    echo   docker-compose logs postgres
    echo   docker-compose logs redis
)

echo ======================================================================
