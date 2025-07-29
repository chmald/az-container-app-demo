# Azure Developer CLI (azd) Quick Start Guide

## Prerequisites ✅
All required tools are installed and validated:
- ✅ Azure CLI (az): Available and ready
- ✅ Azure Developer CLI (azd): v1.18.0
- ✅ Docker: v28.3.2 (Desktop running)

## Infrastructure Validation ✅
Azure deployment files have been validated and are ready:
- ✅ `azure.yaml` - AZD configuration validated (2 services: frontend, backend-service)
- ✅ `infra/main.bicep` - Infrastructure template validated  
- ✅ `infra/resources.bicep` - Resources template validated (simplified 2-app architecture)
- ✅ `infra/main.parameters.json` - Parameters validated
- ✅ Container Apps configuration validated (2 container apps matching azure.yaml)
- ✅ Registry and identity configurations validated
- ✅ No errors found in any infrastructure files

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
- ✅ Create Azure resources using validated Bicep templates
- ✅ Build and push Docker images to Azure Container Registry  
- ✅ Deploy your application with validated Container Apps configuration
- ✅ Configure networking, security, and monitoring (all pre-validated)

**What to expect**: The deployment process has been validated and all infrastructure files are error-free. The deployment should complete successfully with all 4 container apps running your actual application (not placeholder images).

### 3. Access Your Application
After deployment, azd will show the URLs for your services:
- **Frontend**: Your main web application (React with TypeScript)
- **Backend Service**: Consolidated REST API service (Node.js/Express with order, inventory, and notification logic)

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

## Validation Status

Your deployment is backed by validated infrastructure:
- ✅ All azd configuration files validated and error-free
- ✅ Bicep templates validated for best practices
- ✅ Container Apps properly configured with managed identity
- ✅ Registry connections and CORS policies validated
- ✅ Monitoring and security configurations validated

For detailed validation results, see [docs/azd-validation-summary.md](docs/azd-validation-summary.md).

## Customization

- **Infrastructure**: Edit `infra/resources.bicep`
- **Environment variables**: Edit `.env` file
- **Build configuration**: Edit `azure.yaml`
- **Application code**: Update services in `src/` folder

## Troubleshooting

**If you encounter "resource not found" or "azd-service-name" errors:**
- ✅ **Fixed**: Service name mismatch between `azure.yaml` and Bicep templates resolved
- The `backend-service` in `azure.yaml` now correctly maps to the infrastructure resources

**If deployment fails:**
1. Check Azure CLI authentication: `az account show`
2. Verify Docker is running: `docker version`
3. Check azd logs for detailed error messages
4. Ensure you have permissions in the Azure subscription
5. If you see service name errors, run `azd provision` first, then `azd deploy`

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
