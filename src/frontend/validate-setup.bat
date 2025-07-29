@echo off
REM Frontend Setup Validation Script for Windows
REM This script validates that the frontend is properly configured

echo [INFO] Validating Frontend Setup...
echo ================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Not in frontend directory. Run this from src/frontend/
    exit /b 1
)

echo [OK] In frontend directory

REM Check React package.json
if exist "package.json" (
    echo [OK] React package.json found
    
    REM Check for required dependencies
    findstr /c:"react" package.json >nul
    if %errorlevel% equ 0 (
        echo [OK] React dependency found
    ) else (
        echo [ERROR] React dependency missing
    )
    
    findstr /c:"typescript" package.json >nul
    if %errorlevel% equ 0 (
        echo [OK] TypeScript dependency found
    ) else (
        echo [ERROR] TypeScript dependency missing
    )
) else (
    echo [ERROR] React package.json not found
)

REM Check server package.json
if exist "server\package.json" (
    echo [OK] Server package.json found
    
    REM Check for required dependencies
    findstr /c:"express" server\package.json >nul
    if %errorlevel% equ 0 (
        echo [OK] Express dependency found
    ) else (
        echo [ERROR] Express dependency missing
    )
    
    findstr /c:"axios" server\package.json >nul
    if %errorlevel% equ 0 (
        echo [OK] Axios dependency found
    ) else (
        echo [ERROR] Axios dependency missing
    )
) else (
    echo [ERROR] Server package.json not found
)

REM Check server.js
if exist "server\server.js" (
    echo [OK] Server.js found
    
    REM Check for Dapr configuration
    findstr /c:"DAPR_HTTP_PORT" server\server.js >nul
    if %errorlevel% equ 0 (
        echo [OK] Dapr configuration found
    ) else (
        echo [ERROR] Dapr configuration missing
    )
    
    REM Check for proxy routes
    findstr /c:"/api/proxy/" server\server.js >nul
    if %errorlevel% equ 0 (
        echo [OK] API proxy routes found
    ) else (
        echo [ERROR] API proxy routes missing
    )
) else (
    echo [ERROR] Server.js not found
)

REM Check Dockerfile
if exist "Dockerfile" (
    echo [OK] Dockerfile found
    
    REM Check for multi-stage build
    findstr /c:"AS deps" Dockerfile >nul && findstr /c:"AS builder" Dockerfile >nul
    if %errorlevel% equ 0 (
        echo [OK] Multi-stage build configured
    ) else (
        echo [ERROR] Multi-stage build not properly configured
    )
    
    REM Check for security (non-root user)
    findstr /c:"USER frontend" Dockerfile >nul
    if %errorlevel% equ 0 (
        echo [OK] Non-root user configured
    ) else (
        echo [ERROR] Non-root user not configured
    )
) else (
    echo [ERROR] Dockerfile not found
)

REM Check API service
if exist "src\services\api.ts" (
    echo [OK] API service found
    
    REM Check for proxy endpoints
    findstr /c:"/api/proxy/" src\services\api.ts >nul
    if %errorlevel% equ 0 (
        echo [OK] Proxy endpoints configured in API service
    ) else (
        echo [ERROR] Proxy endpoints not configured in API service
    )
) else (
    echo [ERROR] API service not found
)

REM Check for build directory
if exist "build" (
    echo [OK] Build directory exists
    if exist "build\index.html" (
        echo [OK] Built React app found
    ) else (
        echo [WARN] Build directory exists but no built app found
    )
) else (
    echo [INFO] Build directory not found (run 'npm run build' to create)
)

REM Check node_modules
if exist "node_modules" (
    echo [OK] React dependencies installed
) else (
    echo [ERROR] React dependencies not installed (run 'npm install')
)

if exist "server\node_modules" (
    echo [OK] Server dependencies installed
) else (
    echo [ERROR] Server dependencies not installed (run 'cd server && npm install')
)

echo.
echo [SUCCESS] Setup Validation Complete!
echo.

REM Summary
echo Next Steps:
echo 1. If dependencies missing: npm install ^&^& cd server ^&^& npm install
echo 2. For development: npm run start:dev
echo 3. For production build: npm run build ^&^& npm run start:server
echo 4. For Dapr testing: start-with-dapr.bat
echo 5. For Docker build: npm run docker:build
