@echo off
REM Build and push all container images to Azure Container Registry (Windows)
REM Usage: build-and-push.bat [ACR_NAME] [TAG]

set ACR_NAME=%1
if "%ACR_NAME%"=="" (
    if "%ACR_NAME%"=="" (
        echo Error: ACR_NAME is required
        echo Usage: %0 ^<ACR_NAME^> [TAG]
        echo Or set ACR_NAME environment variable
        exit /b 1
    )
)

set TAG=%2
if "%TAG%"=="" set TAG=latest

echo Building and pushing images to %ACR_NAME%.azurecr.io with tag: %TAG%

REM Login to ACR
echo Logging in to Azure Container Registry...
az acr login --name %ACR_NAME%
if errorlevel 1 (
    echo Failed to login to ACR
    exit /b 1
)

REM Build and push Frontend
echo Building Frontend...
cd src\frontend
docker build -t %ACR_NAME%.azurecr.io/frontend:%TAG% .
if errorlevel 1 (
    echo Failed to build frontend image
    exit /b 1
)
echo Pushing Frontend...
docker push %ACR_NAME%.azurecr.io/frontend:%TAG%
if errorlevel 1 (
    echo Failed to push frontend image
    exit /b 1
)
cd ..\..

REM Build and push Order Service
echo Building Order Service...
cd src\order-service
docker build -t %ACR_NAME%.azurecr.io/order-service:%TAG% .
if errorlevel 1 (
    echo Failed to build order service image
    exit /b 1
)
echo Pushing Order Service...
docker push %ACR_NAME%.azurecr.io/order-service:%TAG%
if errorlevel 1 (
    echo Failed to push order service image
    exit /b 1
)
cd ..\..

REM Build and push Inventory Service
echo Building Inventory Service...
cd src\inventory-service
docker build -t %ACR_NAME%.azurecr.io/inventory-service:%TAG% .
if errorlevel 1 (
    echo Failed to build inventory service image
    exit /b 1
)
echo Pushing Inventory Service...
docker push %ACR_NAME%.azurecr.io/inventory-service:%TAG%
if errorlevel 1 (
    echo Failed to push inventory service image
    exit /b 1
)
cd ..\..

REM Build and push Notification Service
echo Building Notification Service...
cd src\notification-service
docker build -t %ACR_NAME%.azurecr.io/notification-service:%TAG% .
if errorlevel 1 (
    echo Failed to build notification service image
    exit /b 1
)
echo Pushing Notification Service...
docker push %ACR_NAME%.azurecr.io/notification-service:%TAG%
if errorlevel 1 (
    echo Failed to push notification service image
    exit /b 1
)
cd ..\..

echo All images built and pushed successfully!
echo.
echo Images pushed:
echo   %ACR_NAME%.azurecr.io/frontend:%TAG%
echo   %ACR_NAME%.azurecr.io/order-service:%TAG%
echo   %ACR_NAME%.azurecr.io/inventory-service:%TAG%
echo   %ACR_NAME%.azurecr.io/notification-service:%TAG%
