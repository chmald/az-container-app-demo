# Azure Container Apps Demo with Dapr Integration

A comprehensive demonstration of Azure Container Apps capabilities featuring a microservices-based e-commerce platform with Dapr integration, VNET security, and enterprise-ready features.

## 🏗️ Architecture Overview

This demo implements a modern microservices architecture with the following components:

### Core Services
- **Frontend Service**: React with TypeScript and Material-UI
- **Order Service**: Node.js/Express REST API with Dapr integration
- **Inventory Service**: Python FastAPI with async operations
- **Notification Service**: Go microservice with pub/sub capabilities

### Infrastructure
- **Azure Container Apps Environment** with VNET integration
- **PostgreSQL Flexible Server** for persistent storage
- **Azure Cache for Redis** for state management and pub/sub
- **Application Insights** for monitoring and observability
- **Azure Key Vault** for secrets management

### Communication Patterns
- **Frontend ↔ Backend Services**: Dapr service invocation through frontend server proxy
  - React app served by Node.js/Express server with Dapr sidecar
  - Frontend server proxies API calls to backend services via Dapr
  - Uses `/api/proxy/*` endpoints that translate to Dapr service invocation
- **Backend Service ↔ Backend Service**: Dapr service-to-service invocation
  - Order Service ↔ Inventory Service via Dapr
  - Notification Service ↔ Other services via Dapr pub/sub
- **State Management**: Dapr state store with Redis backend
- **Event Communication**: Dapr pub/sub with Redis broker

### Frontend Architecture
- **React Build**: Static React app built with TypeScript and Material-UI
- **Node.js Server**: Express server that serves React app and proxies API calls
- **Dapr Integration**: Frontend server has Dapr sidecar for service communication
- **Proxy Pattern**: `/api/proxy/orders` → Dapr → `order-service/api/orders`

## 🚀 Quick Start

> **👆 Want to deploy immediately?** See [QUICKSTART.md](QUICKSTART.md) for a condensed deployment guide.

### Prerequisites
- Azure CLI (`az`) installed and authenticated
- Docker and Docker Compose
- Node.js 18+ and npm
- Python 3.9+ and pip
- Go 1.19+
- Dapr CLI (for local development)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/chmald/az-container-app-demo.git
   cd az-container-app-demo
   ```

2. **Prerequisites for local development**
   - Docker and Docker Compose
   - Node.js 18+ and npm
   - Python 3.9+ and pip
   - Go 1.19+
   - [Dapr CLI](https://docs.dapr.io/getting-started/install-dapr-cli/) installed and initialized (`dapr init`)

3. **Quick Start - All Services (Recommended)**

   **Windows:**
   ```cmd
   # Interactive launcher with menu
   dev.bat

   # Or directly start all services
   scripts\start-local.bat
   ```

   **Linux/macOS:**
   ```bash
   ./scripts/start-local.sh
   ```

   This will:
   - Start PostgreSQL and Redis with Docker Compose
   - Install dependencies for all services
   - Start all services with their Dapr sidecars
   - Open each service in a separate terminal window

4. **Validate Setup**
   ```cmd
   # Windows
   scripts\validate-local.bat

   # Linux/macOS
   ./scripts/validate-deployment.sh
   ```

5. **Stop All Services**
   ```cmd
   # Windows
   scripts\stop-local.bat

   # Linux/macOS
   ./scripts/stop-local.sh
   ```

6. **Manual Service Startup (Alternative)**
   ```bash
   # Start infrastructure first
   docker-compose up -d postgres redis

   # Frontend (React)
   cd src/frontend && npm install && npm start

   # Order Service (Node.js)
   cd src/order-service && npm install && dapr run --app-id order-service --app-port 3001 --dapr-http-port 3501 npm start

   # Inventory Service (Python)
   cd src/inventory-service && pip install -r requirements.txt && dapr run --app-id inventory-service --app-port 8000 --dapr-http-port 3502 uvicorn main:app --host 0.0.0.0 --port 8000

   # Notification Service (Go)
   cd src/notification-service && go mod tidy && dapr run --app-id notification-service --app-port 8080 --dapr-http-port 3503 go run main.go
   ```

### Azure Deployment

#### Option 1: Azure Developer CLI (azd) - Recommended ⭐

The easiest way to deploy this application to Azure is using the Azure Developer CLI (azd).

**Prerequisites:**
- [Azure Developer CLI (azd)](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd) installed
- Azure CLI authenticated (`az login`)
- Docker installed and running

**Quick Deployment:**

1. **Clone and navigate to the repository**
   ```bash
   git clone https://github.com/chmald/az-container-app-demo.git
   cd az-container-app-demo
   ```

2. **Initialize and deploy with azd**
   ```bash
   # Initialize the azd environment (first time only)
   azd init

   # Login to Azure (if not already logged in)
   azd auth login

   # Provision infrastructure and deploy application
   azd up
   ```

   > **Important**: The first `azd up` command will:
   > - Create Azure infrastructure (Container Apps, Registry, Database, etc.)
   > - Build Docker images from your source code
   > - Push images to Azure Container Registry
   > - Deploy your actual application containers (not starter images)

3. **Validate your deployment**
   
   After deployment, verify your application is working correctly:
   
   ```bash
   # Check deployment status
   azd show
   
   # View live logs
   azd logs --follow
   
   # Test the frontend
   curl https://your-frontend-url.azurecontainerapps.io
   
   # Test the APIs (replace with your actual URLs)
   curl https://your-order-service-url.azurecontainerapps.io/health
   curl https://your-inventory-service-url.azurecontainerapps.io/health
   ```

4. **Access your application**
   After deployment completes, azd will display the URLs for your services:
   - Frontend: `https://your-frontend-url.azurecontainerapps.io`
   - Order Service API: `https://your-order-service-url.azurecontainerapps.io`
   - Inventory Service API: `https://your-inventory-service-url.azurecontainerapps.io`
   - Notification Service API: `https://your-notification-service-url.azurecontainerapps.io`

**azd Commands:**
```bash
azd up          # Deploy everything (infrastructure + app)
azd provision   # Deploy only infrastructure
azd deploy      # Deploy only application code
azd down        # Delete all Azure resources
azd logs        # View application logs
azd monitor     # Open Azure portal monitoring
azd env list    # List environments
azd env select  # Switch between environments
```

**Environment Configuration:**
- Copy `.env.template` to `.env` and customize if needed
- Modify `infra/main.parameters.json` for infrastructure parameters
- Update `azure.yaml` for advanced deployment configuration

**Troubleshooting azd Deployment:**

**✅ What Success Looks Like:**
- All 4 container apps are running (not just created)
- Frontend displays the e-commerce interface (not "Hello World")
- API endpoints return JSON responses (not default pages)
- `azd logs` shows application startup messages
- Container images in ACR have your actual application names

**❌ Signs of Problems:**
- Container Apps show "Azure Container Apps" or "Hello World" pages
- APIs return HTML instead of JSON
- `azd logs` shows repeated restarts or build failures
- Images in Azure Container Registry are named "azuredocs/containerapps-helloworld"

**Common Fixes:**
```bash
# If you see starter/hello world pages:
azd deploy                    # Redeploy application containers

# If builds are failing:
azd deploy --debug           # Get detailed build logs

# If environment seems corrupted:
azd down --force --purge     # Clean everything
azd up                       # Start fresh
```

If you see "Hello World" pages instead of your application:
- This indicates the infrastructure was created but your application containers weren't properly built/deployed
- Run `azd deploy` again to rebuild and redeploy your application containers
- Check `azd logs` for build and deployment errors

If Docker build fails:
- Ensure Docker Desktop is running
- Check that all Dockerfile paths are correct in `azure.yaml`
- Verify your source code builds locally: `docker build -t test ./src/frontend`

## 🚀 Benefits of Azure Developer CLI (azd)

- **Simplified Deployment**: Single command deployment (`azd up`)
- **Automatic Container Building**: Builds Docker images from your source code automatically
- **Image Management**: Pushes images to Azure Container Registry and updates Container Apps
- **Environment Management**: Easy switching between dev/staging/prod environments
- **Integrated CI/CD**: Built-in GitHub Actions integration
- **Infrastructure as Code**: Automatic Bicep template management
- **Monitoring Integration**: Direct links to Azure Portal monitoring
- **Rollback Support**: Easy rollback with `azd down` and `azd up`

> **Key Point**: azd starts with placeholder images in the infrastructure, then builds your actual application images and automatically updates the Container Apps. If you see "Hello World" pages, it means the infrastructure deployed successfully but the application images haven't been built/deployed yet.

## � Understanding the azd Deployment Process

When you run `azd up`, here's what happens:

1. **Infrastructure Provisioning** (`azd provision`):
   - Creates Azure resources using Bicep templates
   - Container Apps are initially created with placeholder "Hello World" images
   - Sets up networking, databases, monitoring, etc.

2. **Application Building** (`azd deploy`):
   - Builds Docker images from your source code in each service directory
   - Pushes images to Azure Container Registry with proper naming
   - Updates Container Apps to use your actual application images

3. **Result**:
   - Your applications replace the placeholder images
   - Real functionality becomes available

**This is why you might initially see "Hello World" pages** - they indicate successful infrastructure provisioning but incomplete application deployment.

## ✅ Verifying Your Deployment

After running `azd up`, verify everything is working:

### 1. Check Deployment Status
```bash
azd show                    # Shows all deployed resources and URLs
azd logs --follow          # Shows live application logs
```

### 2. Test Your Applications
```bash
# Test the frontend (should show React app, not "Hello World")
curl -I https://your-frontend-url.azurecontainerapps.io

# Test the APIs (should return JSON, not HTML)
curl https://your-order-service-url.azurecontainerapps.io/health
curl https://your-inventory-service-url.azurecontainerapps.io/api/inventory
```

### 3. Check Azure Portal
- Go to your resource group in Azure Portal
- Look at Container Apps - they should show your custom images, not `mcr.microsoft.com/azuredocs/containerapps-helloworld`
- Check Application Insights for telemetry data

### 4. Expected Behavior
**✅ Success Signs:**
- Frontend shows e-commerce interface with product listings
- API endpoints return JSON responses
- `azd logs` shows application startup messages (not just "Hello World")
- Container registry contains images with your app names

**❌ Problem Signs:**
- "Hello World" or "Azure Container Apps" placeholder pages
- API endpoints return HTML error pages
- Empty product lists or non-functional UI
- Only placeholder images in container registry

### 5. Automated Validation
Run the included validation script to check your deployment:

**Windows (PowerShell):**
```powershell
.\scripts\validate-deployment.ps1
```

**Linux/macOS (Bash):**
```bash
./scripts/validate-deployment.sh
```

This script will:
- Test all service endpoints
- Check container registry for your application images
- Provide specific remediation steps if issues are found

## 🔧 Customizing Your Deployment

**Infrastructure Customization:**
- Edit `infra/resources.bicep` to modify Azure resources
- Update `infra/main.parameters.json` for different environments
- Modify SKUs, scaling settings, and security configurations

**Application Configuration:**
- Update environment variables in the Bicep templates
- Modify container resource allocations
- Configure custom domains and SSL certificates

**Development Workflow:**
```bash
# Make code changes
# ...

# Deploy just the application updates
azd deploy

# Or deploy specific service
azd deploy --service frontend
```

## 📁 Project Structure

```
├── src/
│   ├── frontend/              # React TypeScript frontend
│   ├── order-service/         # Node.js Express API
│   ├── inventory-service/     # Python FastAPI service
│   └── notification-service/  # Go microservice
├── infrastructure/
│   ├── bicep/                # Azure Bicep templates
│   └── dapr/                 # Dapr component definitions
├── docker/                   # Dockerfiles and compose
├── .github/workflows/        # CI/CD pipelines
├── docs/                     # Documentation
└── scripts/                  # Utility scripts
```

## 🔧 Services Details

### Frontend Service (Port 3000)
- **Technology**: React 18, TypeScript, Material-UI, Redux Toolkit
- **Features**: Responsive design, error handling, Dapr SDK integration
- **Endpoints**: Web application accessible at `http://localhost:3000`

### Order Service (Port 3001)
- **Technology**: Node.js, Express, TypeScript, Dapr SDK
- **Features**: JWT authentication, input validation, OpenAPI documentation
- **Endpoints**: 
  - `GET /api/orders` - List orders
  - `POST /api/orders` - Create order
  - `GET /api/orders/:id` - Get order details

### Inventory Service (Port 8000)
- **Technology**: Python, FastAPI, Pydantic, async/await
- **Features**: Database integration, Dapr bindings, comprehensive validation
- **Endpoints**:
  - `GET /api/inventory` - List inventory items
  - `POST /api/inventory` - Add inventory item
  - `PUT /api/inventory/:id` - Update inventory

### Notification Service (Port 8080)
- **Technology**: Go, Dapr pub/sub, structured logging
- **Features**: Email/SMS notifications, graceful shutdown, event processing
- **Endpoints**:
  - `POST /api/notify` - Send notification
  - Health check endpoints

## 🐳 Container Configuration

All services are containerized with:
- Multi-stage builds for optimization
- Non-root user configuration
- Health checks
- Security best practices

## ☁️ Azure Resources

The Bicep templates create:
- Container Apps Environment with VNET integration
- PostgreSQL Flexible Server
- Azure Cache for Redis
- Application Insights
- Log Analytics Workspace
- Key Vault
- Container Registry
- Managed Identity assignments

## 🔒 Security Features

- Zero-trust networking with VNET integration
- Managed identities for Azure resource access
- Secrets stored in Azure Key Vault
- Container image vulnerability scanning
- Network isolation with private endpoints

## 📊 Monitoring & Observability

- Application Insights integration
- Custom telemetry and metrics
- Structured logging across all services
- Health checks and probes
- Distributed tracing with Dapr

## 🧪 Testing

```bash
# Run unit tests
npm test                    # Frontend
npm test                    # Order Service
pytest                     # Inventory Service
go test ./...              # Notification Service

# Run integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📚 Documentation

- [Architecture Decisions](docs/architecture/)
- [API Documentation](docs/api/)
- [Deployment Guide](docs/deployment/)
- [Troubleshooting](docs/troubleshooting.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
- Check the [troubleshooting guide](docs/troubleshooting.md)
- Open an issue on GitHub
- Review the [Azure Container Apps documentation](https://docs.microsoft.com/en-us/azure/container-apps/)

### Common Deployment Issues

**Azure Developer CLI (azd) Issues:**

**Error: "azd command not found"**
```bash
# Install Azure Developer CLI
# Windows (winget)
winget install microsoft.azd

# macOS (Homebrew)
brew tap azure/azd && brew install azd

# Linux
curl -fsSL https://aka.ms/install-azd.sh | bash
```

**Problem: Seeing "Hello World" or starter pages instead of your application**

This is the most common issue and indicates that while the infrastructure was created successfully, your application containers weren't properly built or deployed.

**Symptoms:**
- Container Apps show "Hello World" pages
- APIs return default responses
- Application functionality is missing

**Solutions:**
1. **Redeploy application containers:**
   ```bash
   azd deploy
   ```

2. **Check build logs for errors:**
   ```bash
   azd logs --follow
   ```

3. **Verify Docker is running:**
   - Ensure Docker Desktop is started
   - Test local build: `docker build -t test ./src/frontend`

4. **Check azure.yaml configuration:**
   - Verify docker context paths point to service directories
   - Ensure Dockerfile paths are correct

5. **Force rebuild:**
   ```bash
   azd down --force --purge
   azd up
   ```

**Error: "AZURE_PRINCIPAL_ID not set"**
```bash
# Get your user principal ID
az ad signed-in-user show --query id -o tsv

# Set it in your environment
azd env set AZURE_PRINCIPAL_ID $(az ad signed-in-user show --query id -o tsv)
```

**Error: "Container image not found"**
```bash
# Ensure Docker is running and images are built
azd deploy --debug  # Shows detailed deployment logs
```

**Docker Build Issues:**

If container builds are failing:
1. Check that Docker Desktop is running
2. Verify build context and Dockerfile paths in `azure.yaml`
3. Test builds locally:
   ```bash
   cd src/frontend && docker build -t frontend-test .
   cd ../order-service && docker build -t order-test .
   cd ../inventory-service && docker build -t inventory-test .
   cd ../notification-service && docker build -t notification-test .
   ```

**Network/Connectivity Issues:**

If services can't communicate:
- Check that Dapr is properly configured
- Verify environment variables are set correctly
- Use `azd logs` to check for connection errors

**Continuous Deployment with GitHub Actions:**

The repository includes a GitHub Actions workflow for automatic deployment:

1. **Set up Azure service principal for GitHub Actions:**
   ```bash
   # Create service principal with contributor access
   az ad sp create-for-rbac --name "github-actions-azd" \
     --role contributor \
     --scopes /subscriptions/{subscription-id} \
     --sdk-auth
   ```

2. **Configure GitHub repository variables:**
   - `AZURE_CLIENT_ID`: Service principal client ID
   - `AZURE_TENANT_ID`: Azure tenant ID  
   - `AZURE_SUBSCRIPTION_ID`: Azure subscription ID
   - `AZURE_ENV_NAME`: Environment name (e.g., "dev", "staging", "prod")
   - `AZURE_LOCATION`: Azure region (e.g., "westus3")

3. **Configure GitHub repository secrets (if not using federated credentials):**
   - `AZURE_CLIENT_SECRET`: Service principal client secret

The workflow will automatically deploy on push to main branch.

**Location Restrictions**: If you encounter location restrictions, try these regions:
- West US 3
- West US 2
- East US 2
- Central US
- West Europe
- Southeast Asia

**Naming Conflicts**: Resource names are made unique with a 6-character suffix. If you still encounter conflicts, delete any soft-deleted resources:
```bash
# List and purge soft-deleted Key Vaults
az keyvault list-deleted --query "[].name" -o table
az keyvault purge --name <vault-name> --location <location>
```

**Subnet Size**: Container Apps require a minimum /23 subnet (512 addresses). The template uses /23 by default.

**Resource Provider Registration**: Ensure required providers are registered:
```bash
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.ContainerService --wait
az provider register --namespace Microsoft.DBforPostgreSQL --wait
```

---

**Note**: This is a demonstration project. For production use, review and adjust security configurations, resource sizing, and monitoring according to your specific requirements.
