@echo off
REM Start all services with Dapr for local development
REM Usage: scripts\start-local.bat

setlocal enabledelayedexpansion

echo Starting Azure Container Apps Demo in local development mode...

REM Check if Docker is running
docker info >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if Dapr CLI is installed
where dapr >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Dapr CLI is not installed. Please install it first:
    echo https://docs.dapr.io/getting-started/install-dapr-cli/
    echo.
    echo To install Dapr CLI on Windows:
    echo PowerShell -Command "Invoke-WebRequest -Uri https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -OutFile install-dapr.sh; bash install-dapr.sh"
    echo.
    echo After installation, run: dapr init
    exit /b 1
)

REM Start infrastructure services with Docker Compose
echo Starting infrastructure services (PostgreSQL and Redis)...
docker-compose up -d postgres redis

if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to start infrastructure services
    exit /b 1
)

REM Wait for databases to be ready
echo Waiting for databases to be ready...
timeout /t 15 /nobreak >nul

REM Create log directory for service logs
if not exist logs mkdir logs

echo.
echo Starting Dapr applications...
echo.

REM Start Order Service with Dapr
echo Starting Order Service...
cd src\order-service
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install Order Service dependencies
    cd ..\..
    exit /b 1
)

start "Order Service" cmd /k "dapr run --app-id order-service --app-port 3001 --dapr-http-port 3501 --dapr-grpc-port 50001 --components-path ..\..\infra\dapr\components --config ..\..\infra\dapr\configuration\config.yaml npm start"
cd ..\..

REM Wait a bit before starting next service
timeout /t 3 /nobreak >nul

REM Start Inventory Service with Dapr
echo Starting Inventory Service...
cd src\inventory-service
pip install -r requirements.txt >nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install Inventory Service dependencies
    cd ..\..
    exit /b 1
)

start "Inventory Service" cmd /k "dapr run --app-id inventory-service --app-port 8000 --dapr-http-port 3502 --dapr-grpc-port 50002 --components-path ..\..\infra\dapr\components --config ..\..\infra\dapr\configuration\config.yaml python main.py"
cd ..\..

REM Wait a bit before starting next service
timeout /t 3 /nobreak >nul

REM Start Notification Service with Dapr
echo Starting Notification Service...
cd src\notification-service
go mod tidy >nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to prepare Notification Service dependencies
    cd ..\..
    exit /b 1
)

start "Notification Service" cmd /k "dapr run --app-id notification-service --app-port 8080 --dapr-http-port 3503 --dapr-grpc-port 50003 --components-path ..\..\infra\dapr\components --config ..\..\infra\dapr\configuration\config.yaml go run main.go"
cd ..\..

REM Wait a bit before starting frontend
timeout /t 5 /nobreak >nul

REM Start Frontend with Dapr
echo Starting Frontend...
cd src\frontend

REM Install dependencies
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install Frontend dependencies
    cd ..\..
    exit /b 1
)

REM Build React app
echo Building React app...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to build React app
    cd ..\..
    exit /b 1
)

REM Install server dependencies
cd server
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install Frontend server dependencies
    cd ..\..\..
    exit /b 1
)
cd ..

start "Frontend" cmd /k "dapr run --app-id frontend --app-port 3000 --dapr-http-port 3500 --dapr-grpc-port 50001 --components-path ..\..\infra\dapr\components --config ..\..\infra\dapr\configuration\config.yaml node server\server.js"
cd ..\..

echo.
echo ======================================================================
echo All services started successfully!
echo ======================================================================
echo.
echo Services running on:
echo   Frontend:          http://localhost:3000
echo   Order Service:     http://localhost:3001 ^(Dapr: http://localhost:3501^)
echo   Inventory Service: http://localhost:8000 ^(Dapr: http://localhost:3502^)
echo   Notification Svc:  http://localhost:8080 ^(Dapr: http://localhost:3503^)
echo   PostgreSQL:        localhost:5432
echo   Redis:             localhost:6379
echo.
echo API Documentation:
echo   Order Service:     http://localhost:3001/api-docs
echo   Inventory Service: http://localhost:8000/api/docs
echo.
echo Each service is running in its own command window.
echo To stop all services, run: scripts\stop-local.bat
echo To view Dapr logs, run: dapr logs --app-id ^<service-name^>
echo.
echo Available Dapr service IDs: frontend, order-service, inventory-service, notification-service
echo ======================================================================

pause
