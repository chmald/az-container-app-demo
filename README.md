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

## 🚀 Quick Start

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

2. **Start local development environment**
   ```bash
   docker-compose up -d
   ```

3. **Initialize Dapr (if not using Docker)**
   ```bash
   dapr init
   ```

4. **Start services individually**
   ```bash
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

1. **Deploy infrastructure**
   ```bash
   cd infrastructure/bicep
   
   # Create resource group if it doesn't exist
   az group create --name az-container-apps-demo --location "East US 2"
   
   # Deploy the infrastructure
   az deployment group create \
     --resource-group az-container-apps-demo \
     --template-file main.bicep \
     --parameters @parameters.json
   ```

2. **Build and push container images**
   ```bash
   # Get your container registry name from deployment output
   export ACR_NAME=$(az deployment group show --resource-group az-container-apps-demo --name main --query properties.outputs.acrLoginServer.value -o tsv | cut -d'.' -f1)
   
   # Login to ACR
   az acr login --name $ACR_NAME
   
   # Build and push images
   ./scripts/build-and-push.sh
   ```

3. **Deploy applications** (if using manual deployment)
   ```bash
   # Update container apps with new images
   az containerapp update --name ecommerce-dev-frontend --resource-group az-container-apps-demo --image $ACR_NAME.azurecr.io/frontend:latest
   az containerapp update --name ecommerce-dev-order-service --resource-group az-container-apps-demo --image $ACR_NAME.azurecr.io/order-service:latest
   az containerapp update --name ecommerce-dev-inventory-service --resource-group az-container-apps-demo --image $ACR_NAME.azurecr.io/inventory-service:latest
   az containerapp update --name ecommerce-dev-notification-service --resource-group az-container-apps-demo --image $ACR_NAME.azurecr.io/notification-service:latest
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

**Location Restrictions**: If you encounter location restrictions, try these regions:
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
