@echo off
REM Main launcher for Azure Container Apps Demo local development
REM Usage: dev.bat

:menu
cls
echo ======================================================================
echo Azure Container Apps Demo - Local Development
echo ======================================================================
echo.
echo Choose an option:
echo.
echo 1. Start all services with Dapr
echo 2. Stop all services
echo 3. Validate services health
echo 4. View Dapr logs
echo 5. Clean restart (stop + start)
echo 6. Show service URLs
echo 7. Exit
echo.
set /p choice=Enter your choice (1-7): 

if "%choice%"=="1" goto start_services
if "%choice%"=="2" goto stop_services
if "%choice%"=="3" goto validate_services
if "%choice%"=="4" goto view_logs
if "%choice%"=="5" goto clean_restart
if "%choice%"=="6" goto show_urls
if "%choice%"=="7" goto exit
goto menu

:start_services
echo.
echo Starting all services...
call scripts\start-local.bat
echo.
pause
goto menu

:stop_services
echo.
echo Stopping all services...
call scripts\stop-local.bat
echo.
pause
goto menu

:validate_services
echo.
echo Validating services...
call scripts\validate-local.bat
echo.
pause
goto menu

:view_logs
echo.
echo Available services: frontend, backend-service
echo.
set /p service=Enter service name to view logs: 
if not "%service%"=="" (
    dapr logs --app-id %service%
) else (
    echo No service specified.
)
echo.
pause
goto menu

:clean_restart
echo.
echo Performing clean restart...
call scripts\stop-local.bat
echo.
echo Waiting 5 seconds...
timeout /t 5 /nobreak >nul
echo.
call scripts\start-local.bat
echo.
pause
goto menu

:show_urls
echo.
echo ======================================================================
echo Service URLs:
echo ======================================================================
echo.
echo Frontend:         http://localhost:3000
echo Backend Service:  http://localhost:3001
echo.
echo Dapr Sidecars:
echo Frontend Dapr:    http://localhost:3500
echo Backend Dapr:     http://localhost:3501
echo.
echo Infrastructure:
echo PostgreSQL:       localhost:5432
echo Redis:            localhost:6379
echo.
echo API Documentation:
echo Backend Service:  http://localhost:3001/api-docs
echo ======================================================================
echo.
pause
goto menu

:exit
echo.
echo Goodbye!
exit /b 0
