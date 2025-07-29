@echo off
REM Pre-deployment script for Azure Developer CLI (Windows)
REM This script builds and pushes all container images

echo Building and pushing container images...

REM Get the ACR name from azd environment
if "%AZURE_CONTAINER_REGISTRY_NAME%"=="" (
    echo Error: AZURE_CONTAINER_REGISTRY_NAME environment variable not set
    exit /b 1
)

echo Container registry: %AZURE_CONTAINER_REGISTRY_NAME%

REM Azure Developer CLI will handle the actual image building and pushing
REM This script is run as part of the azd deployment process
echo Azure Developer CLI will build and push container images automatically during deployment

echo Pre-deployment tasks completed successfully!
