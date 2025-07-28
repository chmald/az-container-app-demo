@echo off
REM Pre-deployment script for Azure Developer CLI (Windows)
REM This script builds and pushes all container images

echo Building and pushing container images...

REM Get the ACR name from azd environment
if "%AZURE_CONTAINER_REGISTRY_NAME%"=="" (
    echo Error: AZURE_CONTAINER_REGISTRY_NAME environment variable not set
    exit /b 1
)

REM Call the existing build script
call scripts\build-and-push.bat %AZURE_CONTAINER_REGISTRY_NAME% latest

echo Container images built and pushed successfully!
