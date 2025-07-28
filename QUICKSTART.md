# Azure Developer CLI (azd) Quick Start Guide

## Prerequisites ✅
All required tools are installed:
- Azure CLI (az): Available
- Azure Developer CLI (azd): v1.18.0
- Docker: v28.3.2

## Quick Deployment Steps

### 1. Initialize azd (First time only)
```bash
azd init
```
When prompted:
- Choose "Use code in the current directory"
- Confirm the detected services
- Select your Azure subscription
- Choose a location (recommended: westus3)

### 2. Deploy to Azure
```bash
azd up
```

This single command will:
- Create Azure resources (Container Apps, PostgreSQL, Redis, etc.)
- Build and push Docker images
- Deploy your application
- Configure networking and security

### 3. Access Your Application
After deployment, azd will show the URLs for your services:
- **Frontend**: Your main web application
- **Order Service**: REST API for orders
- **Inventory Service**: REST API for inventory
- **Notification Service**: Messaging service

## Useful Commands

```bash
azd logs                 # View application logs
azd monitor             # Open Azure portal monitoring
azd deploy              # Deploy application updates only
azd provision           # Deploy infrastructure only
azd down                # Delete all Azure resources
azd env list            # List your environments
azd env set KEY=value   # Set environment variables
```

## Customization

- **Infrastructure**: Edit `infra/resources.bicep`
- **Environment variables**: Edit `.env` file
- **Build configuration**: Edit `azure.yaml`
- **Application code**: Update services in `src/` folder

## Troubleshooting

**If deployment fails:**
1. Check Azure CLI authentication: `az account show`
2. Verify Docker is running: `docker version`
3. Check azd logs for detailed error messages
4. Ensure you have permissions in the Azure subscription

**For detailed logs:**
```bash
azd up --debug
```

## Next Steps

1. **Test your application endpoints**
2. **Configure monitoring alerts**
3. **Set up custom domains and SSL**
4. **Configure CI/CD with GitHub Actions**

Your Azure Container Apps demo is ready to deploy! 🚀
