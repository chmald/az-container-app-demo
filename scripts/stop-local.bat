@echo off
REM Stop all local services started with start-local.bat
REM Usage: scripts\stop-local.bat

echo Stopping Azure Container Apps Demo local development environment...

REM Stop all Dapr applications
echo Stopping Dapr applications...
dapr stop --app-id frontend 2>nul
dapr stop --app-id order-service 2>nul
dapr stop --app-id inventory-service 2>nul
dapr stop --app-id notification-service 2>nul

REM Kill any remaining node, python, or go processes that might be running our services
echo Stopping remaining service processes...

REM Stop Node.js processes (Order Service and Frontend)
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo table /nh 2^>nul') do (
    if not "%%i"=="INFO:" (
        taskkill /pid %%i /f >nul 2>&1
    )
)

REM Stop Python processes (Inventory Service)
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq python.exe" /fo table /nh 2^>nul') do (
    if not "%%i"=="INFO:" (
        taskkill /pid %%i /f >nul 2>&1
    )
)

REM Stop Go processes (Notification Service)
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq go.exe" /fo table /nh 2^>nul') do (
    if not "%%i"=="INFO:" (
        taskkill /pid %%i /f >nul 2>&1
    )
)

REM Stop any remaining Dapr processes
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq daprd.exe" /fo table /nh 2^>nul') do (
    if not "%%i"=="INFO:" (
        taskkill /pid %%i /f >nul 2>&1
    )
)

REM Stop Docker Compose services
echo Stopping Docker Compose services...
docker-compose down

echo.
echo ======================================================================
echo All services stopped successfully!
echo ======================================================================
echo.
echo Infrastructure services (PostgreSQL, Redis) have been stopped.
echo All Dapr sidecars and application processes have been terminated.
echo.
echo To start services again, run: scripts\start-local.bat
echo ======================================================================
