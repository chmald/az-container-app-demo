@echo off
REM Post-deployment script for Azure Developer CLI (Windows)
REM This script provides information about the deployed application

echo.
echo =====================================================================
echo ✅ Azure Container Apps Demo deployed successfully!
echo =====================================================================
echo.

if not "%SERVICE_FRONTEND_ENDPOINT_URL%"=="" (
    echo 🌐 Frontend Application: %SERVICE_FRONTEND_ENDPOINT_URL%
)

if not "%SERVICE_ORDER_SERVICE_ENDPOINT_URL%"=="" (
    echo 📦 Order Service API: %SERVICE_ORDER_SERVICE_ENDPOINT_URL%
)

if not "%SERVICE_INVENTORY_SERVICE_ENDPOINT_URL%"=="" (
    echo 📋 Inventory Service API: %SERVICE_INVENTORY_SERVICE_ENDPOINT_URL%
)

if not "%SERVICE_NOTIFICATION_SERVICE_ENDPOINT_URL%"=="" (
    echo 📧 Notification Service API: %SERVICE_NOTIFICATION_SERVICE_ENDPOINT_URL%
)

echo.
echo 📊 Monitor your applications:
if not "%AZURE_CONTAINER_APPS_ENVIRONMENT_ID%"=="" (
    echo    Azure Portal: https://portal.azure.com/#@/resource%AZURE_CONTAINER_APPS_ENVIRONMENT_ID%
)

echo.
echo 🔧 Next steps:
echo    1. Test your application endpoints
echo    2. Check application logs: azd logs
echo    3. Set up monitoring alerts in Azure Portal
echo    4. Configure custom domains and SSL certificates
echo.
echo 💡 Useful commands:
echo    azd logs        - View application logs
echo    azd down        - Tear down all resources
echo    azd deploy      - Deploy application updates
echo    azd monitor     - Open monitoring dashboard
echo.
