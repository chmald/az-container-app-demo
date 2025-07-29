# Azure Container Apps Demo with Dapr Integration

A comprehensive demonstration of Azure Container Apps capabilities featuring a microservices-based e-commerce platform with Dapr integration, VNET security, and enterprise-ready features.

## 🏗️ Architecture Overview

This demo implements a modern microservices architecture with the following components:

### Core Services
- **Frontend Service**: React with TypeScript and Material-UI, served by Node.js/Express server with Dapr sidecar
- **Backend Service**: Consolidated Node.js/Express service containing all business logic (orders, inventory, notifications) with Dapr integration

### Infrastructure
- **Azure Container Apps Environment** with VNET integration
- **PostgreSQL Flexible Server** for persistent storage
- **Azure Cache for Redis** for state management and pub/sub
- **Application Insights** for monitoring and observability
- **Azure Key Vault** for secrets management

### Communication Patterns
- **Frontend ↔ Backend Service**: Dapr service invocation through frontend server proxy
  - React app served by Node.js/Express server with Dapr sidecar
  - Frontend server proxies API calls to backend service via Dapr
  - Uses `/api/proxy/*` endpoints that translate to Dapr service invocation
- **Backend Service**: Consolidated service containing all order, inventory, and notification logic
- **State Management**: Dapr state store with Redis backend
- **Event Communication**: Dapr pub/sub with Redis broker

### Frontend Architecture
- **React Build**: Static React app built with TypeScript and Material-UI
- **Node.js Server**: Express server that serves React app and proxies API calls via Dapr
- **Dapr Integration**: Frontend server has Dapr sidecar for service communication
- **Proxy Pattern**: `/api/proxy/orders` → Dapr → `backend-service/api/orders`
- **Health Monitoring**: Comprehensive health checks and observability

### Backend Service Architecture  
- **Consolidated Design**: Single Node.js service containing all business logic
- **Modules**: Order management, inventory tracking, notification system
- **Dapr Integration**: State management and pub/sub messaging
- **API Documentation**: OpenAPI/Swagger documentation available
- **Database**: PostgreSQL integration with connection pooling

## 🚀 Quick Start

> **👆 Want to deploy immediately?** See [QUICKSTART.md](QUICKSTART.md) for a condensed deployment guide.

### Prerequisites
- **Azure CLI (`az`)** - installed and authenticated
- **Docker Desktop** - for containerization and local development
- **Node.js 18+** and npm - for frontend and backend services
- **Azure Developer CLI (azd)** - for streamlined Azure deployment
- **Dapr CLI** - for local microservices development (optional for Azure deployment)

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

   # Backend Service (Node.js with consolidated logic)
   cd src/backend-service && npm install && dapr run --app-id backend-service --app-port 3001 --dapr-http-port 3501 npm start
   ```

### Azure Deployment

#### Option 1: Azure Developer CLI (azd) - Recommended ⭐

The easiest way to deploy this application to Azure is using the Azure Developer CLI (azd).

**Prerequisites:**
- ✅ [Azure Developer CLI (azd)](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd) v1.18.0 installed and validated
- ✅ Azure CLI authenticated (`az login`) - ready for deployment
- ✅ Docker v28.3.2 installed and running - validated

**Infrastructure Validation Status:**
- ✅ All azd deployment files validated and ready
- ✅ Bicep templates validated (main.bicep, resources.bicep)
- ✅ Container Apps configuration validated (2 services: frontend + backend-service)
- ✅ User-assigned managed identity and role assignments configured
- ✅ Container registry connections validated
- ✅ CORS policies configured for all services
- ✅ Dapr components configured (Redis state store and pub/sub)
- ✅ No errors found in infrastructure files

**Quick Deployment:**

> **📋 Validation Status**: All azd files and prerequisites have been validated and are ready for deployment. See [azd validation summary](docs/azd-validation-summary.md) for detailed validation results.

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
   > - Deploy your actual application containers (React frontend + consolidated Node.js backend)

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
   curl https://your-backend-service-url.azurecontainerapps.io/health
   ```

4. **Access your application**
   After deployment completes, azd will display the URLs for your services:
   - Frontend: `https://your-frontend-url.azurecontainerapps.io`
   - Backend Service API: `https://your-backend-service-url.azurecontainerapps.io`

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
curl https://your-backend-service-url.azurecontainerapps.io/health
curl https://your-backend-service-url.azurecontainerapps.io/api/orders
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
az-container-app-demo/
├── azure.yaml                    # Azure Developer CLI configuration
├── docker-compose.yml           # Local development with Dapr
├── dev.bat                      # Windows development launcher
│
├── src/
│   ├── frontend/                # React TypeScript SPA with Express server
│   │   ├── src/                 # React application source
│   │   ├── server/              # Express.js proxy server with Dapr
│   │   ├── Dockerfile           # Multi-stage container build
│   │   └── package.json         # Dependencies and scripts
│   │
│   └── backend-service/         # Consolidated Node.js service
│       ├── src/                 # TypeScript source code
│       │   ├── controllers/     # API request handlers
│       │   ├── services/        # Business logic (orders, inventory, notifications)
│       │   ├── models/          # Data models and types
│       │   ├── routes/          # Express route definitions
│       │   └── dapr/            # Dapr integration
│       ├── Dockerfile           # Container configuration
│       └── package.json         # Dependencies and build scripts
│
├── infra/                       # Infrastructure as Code
│   ├── main.bicep              # Main Azure resources template
│   ├── resources.bicep         # Detailed resource definitions
│   ├── main.parameters.json    # Environment parameters
│   └── dapr/                   # Dapr component configurations
│       ├── components/         # State store and pub/sub configs
│       └── configuration/      # Dapr runtime settings
│
├── scripts/                    # Development and deployment scripts
│   ├── start-local.bat/.sh    # Start all services locally
│   ├── stop-local.bat/.sh     # Stop local development
│   └── validate-deployment.*  # Post-deployment validation
│
└── docs/                       # Project documentation
    ├── azd-validation-summary.md
    ├── troubleshooting.md
    ├── frontend-architecture.md
    ├── frontend-development.md
    └── frontend-communication-changes.md
```

## 🔧 Services Details

### Frontend Service (Port 3000)
- **Technology Stack**: 
  - React 18 with TypeScript
  - Material-UI component library
  - Redux Toolkit for state management
  - Express.js server with Dapr integration
- **Architecture**: 
  - React SPA served by Express.js proxy server
  - Server-side API proxying via Dapr service invocation
  - `/api/proxy/*` endpoints route to backend services
- **Features**: 
  - Responsive e-commerce interface
  - Real-time inventory and order management
  - Comprehensive error handling and health monitoring
- **Endpoints**: 
  - Web application at root path (`/`)
  - Health checks at `/health` and `/api/health/detailed`
  - API proxy routes at `/api/proxy/*`

### Backend Service (Port 3001)
- **Technology Stack**: 
  - Node.js with Express.js framework
  - TypeScript for type safety
  - Dapr SDK for microservices communication
  - Winston for structured logging
- **Architecture**: 
  - Consolidated service containing all business logic
  - Modular design with separate controllers and services
  - OpenAPI/Swagger documentation integration
- **Core Modules**:
  - **Order Management**: Create, read, update, and track orders
  - **Inventory Management**: Product catalog and stock tracking
  - **Notification System**: Event-driven notifications and alerts
- **Key Features**:
  - RESTful API with comprehensive validation
  - JWT authentication and authorization
  - Dapr state management and pub/sub messaging
  - PostgreSQL database integration with connection pooling
  - Rate limiting and security middleware
- **API Endpoints**: 
  - `GET /api/orders` - List all orders
  - `POST /api/orders` - Create new order
  - `GET /api/orders/:id` - Get order details
  - `PUT /api/orders/:id` - Update order
  - `GET /api/inventory` - List inventory items
  - `POST /api/inventory` - Add inventory item
  - `PUT /api/inventory/:id` - Update inventory
  - `POST /api/notifications` - Send notification
  - `GET /health` - Service health check
  - `GET /docs` - OpenAPI documentation

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

### Local Testing
```bash
# Frontend unit tests
cd src/frontend
npm test

# Backend service unit tests  
cd src/backend-service
npm test

# Frontend with coverage
npm run test:ci

# Backend with coverage and watch mode
npm run test:watch
```

### Integration Testing
```bash
# Start full environment for testing
docker-compose up -d

# Run integration tests (when available)
npm run test:integration

# Validate local deployment
scripts\validate-local.bat        # Windows
./scripts/validate-deployment.sh  # Linux/macOS
```

### Load Testing
```bash
# Install dependencies for load testing
npm install -g artillery

# Run load tests against deployed services
artillery run tests/load-test.yml
```

## 📚 Documentation

### Architecture & Design
- [Frontend Architecture](docs/frontend-architecture.md) - Detailed Express + React + Dapr integration
- [Frontend Development Guide](docs/frontend-development.md) - Local development setup and workflows
- [Frontend Communication Changes](docs/frontend-communication-changes.md) - Dapr integration implementation

### Deployment & Operations  
- [Quick Start Guide](QUICKSTART.md) - Fast deployment with Azure Developer CLI
- [Project Status](PROJECT_STATUS.md) - Current implementation status and roadmap
- [Deployment Ready](DEPLOYMENT_READY.md) - Pre-deployment checklist and validation
- [AZD Validation Summary](docs/azd-validation-summary.md) - Infrastructure validation results
- [Troubleshooting Guide](docs/troubleshooting.md) - Common issues and solutions

### Additional Resources
- [Azure Container Apps Documentation](https://docs.microsoft.com/en-us/azure/container-apps/)
- [Dapr Documentation](https://docs.dapr.io/)
- [Azure Developer CLI Documentation](https://docs.microsoft.com/en-us/azure/developer/azure-developer-cli/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Important Note

This is a demonstration project showcasing Azure Container Apps and Dapr integration. For production use, review and adjust security configurations, resource sizing, and monitoring according to your specific requirements.

---

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
   cd ../backend-service && docker build -t backend-test .
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

## 📋 Project Status

**Current Status**: ✅ **READY FOR DEPLOYMENT AND SHARING**  
**Last Updated**: July 29, 2025

- ✅ All infrastructure files validated and ready
- ✅ Applications tested and functional  
- ✅ Documentation synchronized and current
- ✅ Azure Developer CLI deployment validated

For detailed status information, see [PROJECT_STATUS.md](PROJECT_STATUS.md) and [DEPLOYMENT_READY.md](DEPLOYMENT_READY.md).

---
