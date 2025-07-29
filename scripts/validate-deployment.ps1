# Validate Azure Container Apps Deployment
# This script helps verify that your application containers are properly deployed

param(
    [string]$EnvironmentName = $env:AZURE_ENV_NAME
)

if (-not $EnvironmentName) {
    Write-Error "Environment name not provided. Set AZURE_ENV_NAME or pass -EnvironmentName parameter"
    exit 1
}

Write-Host "🔍 Validating deployment for environment: $EnvironmentName" -ForegroundColor Green

# Get azd environment info
Write-Host "`n📋 Getting deployment info..." -ForegroundColor Yellow
$envInfo = azd env get-values --output json | ConvertFrom-Json

if (-not $envInfo) {
    Write-Error "Could not get environment info. Make sure you're in the right directory and environment is set."
    exit 1
}

# Extract service URLs
$frontendUrl = $envInfo.SERVICE_FRONTEND_ENDPOINT_URL
$orderUrl = $envInfo.SERVICE_ORDER_SERVICE_ENDPOINT_URL
$inventoryUrl = $envInfo.SERVICE_INVENTORY_SERVICE_ENDPOINT_URL
$notificationUrl = $envInfo.SERVICE_NOTIFICATION_SERVICE_ENDPOINT_URL

Write-Host "`n🌐 Service URLs:" -ForegroundColor Cyan
Write-Host "Frontend: $frontendUrl"
Write-Host "Order Service: $orderUrl"
Write-Host "Inventory Service: $inventoryUrl"
Write-Host "Notification Service: $notificationUrl"

# Test frontend
Write-Host "`n🧪 Testing Frontend..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri $frontendUrl -Method HEAD -TimeoutSec 10
    if ($frontendResponse.StatusCode -eq 200) {
        $contentType = $frontendResponse.Headers.'Content-Type'
        if ($contentType -like "*text/html*") {
            Write-Host "✅ Frontend is responding with HTML" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Frontend responded but not with HTML content" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Frontend is not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# Test APIs
$apis = @(
    @{ Name = "Order Service"; Url = "$orderUrl/health" },
    @{ Name = "Inventory Service"; Url = "$inventoryUrl/health" },
    @{ Name = "Notification Service"; Url = "$notificationUrl/health" }
)

foreach ($api in $apis) {
    Write-Host "`n🧪 Testing $($api.Name)..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $api.Url -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            $contentType = $response.Headers.'Content-Type'
            if ($contentType -like "*application/json*") {
                Write-Host "✅ $($api.Name) is responding with JSON" -ForegroundColor Green
            } else {
                Write-Host "⚠️  $($api.Name) responded but not with JSON (might be placeholder)" -ForegroundColor Yellow
                Write-Host "   Content-Type: $contentType"
            }
        } else {
            Write-Host "⚠️  $($api.Name) responded with status $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $($api.Name) is not responding: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Check container registry for custom images
Write-Host "`n🐳 Checking Container Registry..." -ForegroundColor Yellow
$acrName = $envInfo.AZURE_CONTAINER_REGISTRY_NAME
if ($acrName) {
    try {
        $repos = az acr repository list --name $acrName --output json | ConvertFrom-Json
        Write-Host "Found repositories: $($repos -join ', ')" -ForegroundColor Cyan
        
        $expectedRepos = @("frontend", "order-service", "inventory-service", "notification-service")
        $missingRepos = $expectedRepos | Where-Object { $_ -notin $repos }
        
        if ($missingRepos.Count -eq 0) {
            Write-Host "✅ All expected container images found in registry" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Missing container images: $($missingRepos -join ', ')" -ForegroundColor Yellow
            Write-Host "   This indicates the applications weren't built/pushed properly"
        }
    } catch {
        Write-Host "❌ Could not check container registry: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Container registry name not found in environment" -ForegroundColor Yellow
}

Write-Host "`n📊 Validation Summary:" -ForegroundColor Green
Write-Host "If you see ⚠️ or ❌ indicators above, try running:" -ForegroundColor White
Write-Host "  azd deploy                    # Redeploy application containers" -ForegroundColor Cyan
Write-Host "  azd logs --follow            # Check for build/deployment errors" -ForegroundColor Cyan
Write-Host "  azd down && azd up           # Full redeployment (if needed)" -ForegroundColor Cyan
