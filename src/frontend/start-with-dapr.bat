@echo off
REM Start frontend with Dapr sidecar for local development

echo Starting frontend with Dapr sidecar...

REM Check if Dapr is installed
where dapr >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Dapr CLI is not installed. Please install it first:
    echo https://docs.dapr.io/getting-started/install-dapr-cli/
    exit /b 1
)

REM Build React app first
echo Building React app...
call npm run build

REM Start frontend server with Dapr
echo Starting frontend server with Dapr...
cd server
call npm install
cd ..

dapr run ^
    --app-id frontend ^
    --app-port 3000 ^
    --dapr-http-port 3500 ^
    --dapr-grpc-port 50001 ^
    --components-path ..\..\infra\dapr\components ^
    --config ..\..\infra\dapr\configuration\config.yaml ^
    node server\server.js
