# Azure Container Apps Demo - Troubleshooting Guide

## Common Issues and Solutions

### Local Development

#### Services not starting
**Issue**: Services fail to start with Dapr  
**Solution**: 
1. Ensure Dapr CLI is installed: `dapr --version`
2. Initialize Dapr: `dapr init`
3. Check Docker is running: `docker ps`
4. Verify ports are not in use: `netstat -an | grep :3001`

#### Frontend can't connect to backend services
**Issue**: Frontend shows connection errors  
**Solution**:
1. Check if order-service is running on port 3001
2. Verify Dapr sidecar is running on port 3501
3. Check browser console for CORS errors
4. Ensure proxy configuration in package.json is correct

#### Database connection errors
**Issue**: Services can't connect to PostgreSQL or Redis  
**Solution**:
1. Check containers are running: `docker ps`
2. Verify connection strings in environment variables
3. Wait for databases to fully initialize (30+ seconds)
4. Check logs: `docker logs ecommerce-postgres`

### Azure Deployment

#### Container Apps failing to start
**Issue**: Container Apps show "Failed" status  
**Solution**:
1. Check container logs in Azure Portal
2. Verify image exists in ACR: `az acr repository list --name <acr-name>`
3. Check resource limits (CPU/Memory)
4. Verify environment variables are set correctly

#### Dapr components not working
**Issue**: Services can't communicate via Dapr  
**Solution**:
1. Check Dapr component configurations in Azure Portal
2. Verify Redis connection string
3. Check Key Vault access permissions
4. Review Dapr logs in Container Apps logs

#### Image pull errors
**Issue**: "Failed to pull image" errors  
**Solution**:
1. Check ACR authentication: `az acr login --name <acr-name>`
2. Verify image tags exist
3. Check Container Apps managed identity permissions
4. Ensure ACR allows pulls from Container Apps

### Performance Issues

#### Slow response times
**Symptoms**: APIs responding slowly  
**Solutions**:
1. Check Container Apps scaling configuration
2. Review resource allocation (CPU/Memory)
3. Monitor Application Insights for bottlenecks
4. Check database performance

#### High memory usage
**Symptoms**: Services being killed due to memory limits  
**Solutions**:
1. Increase memory allocation in Container Apps
2. Review application memory leaks
3. Optimize Docker images (multi-stage builds)
4. Check for memory-intensive operations

### Development Environment

#### Node.js version conflicts
**Issue**: Frontend or Order Service build failures  
**Solution**:
1. Use Node.js 18: `nvm use 18`
2. Clear npm cache: `npm cache clean --force`
3. Delete node_modules and reinstall: `rm -rf node_modules && npm install`

#### Python dependency conflicts
**Issue**: Inventory Service fails to start  
**Solution**:
1. Use Python 3.11: `python --version`
2. Create virtual environment: `python -m venv venv`
3. Install requirements: `pip install -r requirements.txt`

#### Go module issues
**Issue**: Notification Service build errors  
**Solution**:
1. Use Go 1.19+: `go version`
2. Clean module cache: `go clean -modcache`
3. Update dependencies: `go mod tidy`

## Debugging Commands

### Check service health
```bash
# Local services
curl http://localhost:3001/health  # Order Service
curl http://localhost:8000/health  # Inventory Service
curl http://localhost:8080/health  # Notification Service

# Azure services
curl https://<app-name>/health
```

### View Dapr logs
```bash
# Local
dapr logs --app-id order-service

# Azure - use Azure Portal or CLI
az containerapp logs show --name <app-name> --resource-group <rg-name>
```

### Check Dapr components
```bash
# Local
dapr components -k

# Azure
az containerapp env dapr-component list --name <env-name> --resource-group <rg-name>
```

### Database debugging
```bash
# Connect to PostgreSQL
docker exec -it ecommerce-postgres psql -U postgres -d ecommerce

# Connect to Redis
docker exec -it ecommerce-redis redis-cli
```

## Monitoring

### Application Insights Queries
```kusto
// Failed requests
requests
| where success == false
| order by timestamp desc

// High response times
requests
| where duration > 1000
| order by timestamp desc

// Exception tracking
exceptions
| order by timestamp desc
```

### Container Apps Metrics
- Monitor CPU and Memory usage
- Check request rates and response times
- Review scaling events
- Monitor Dapr sidecar metrics

## Support Resources

- [Azure Container Apps Documentation](https://docs.microsoft.com/en-us/azure/container-apps/)
- [Dapr Documentation](https://docs.dapr.io/)
- [Container Apps Troubleshooting](https://docs.microsoft.com/en-us/azure/container-apps/troubleshooting)

## Contact

For issues with this demo:
1. Check existing GitHub issues
2. Create a new issue with:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Logs