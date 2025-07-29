# Frontend Architecture: Express + React + Dapr Integration

## Overview

The frontend service combines a **React SPA** with an **Express server** that acts as a proxy to backend microservices through **Dapr service invocation**. This architecture provides a secure, scalable, and maintainable way to handle client-server communication in a microservices environment.

## Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Container                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌──────────────────────────────────┐ │
│  │   React SPA     │    │        Express Server           │ │
│  │   (Static)      │    │      (server.js)                │ │
│  │                 │    │                                  │ │
│  │ • TypeScript    │    │ • Serves React build            │ │
│  │ • Material-UI   │    │ • Proxies API calls             │ │
│  │ • Redux Toolkit │    │ • /api/proxy/* endpoints        │ │
│  │ • React Router  │    │ • Security middleware           │ │
│  └─────────────────┘    └──────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Dapr Sidecar                            │
│  • Service invocation                                      │
│  • State management                                        │
│  • Pub/sub messaging                                       │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
              ┌─────────────────────────────────┐
              │        Backend Services         │
              │                                 │
              │ • Order Service (Node.js)      │
              │ • Inventory Service (Python)   │
              │ • Notification Service (Go)    │
              └─────────────────────────────────┘
```

## Request Flow

### 1. Client-Side Request (React)
```typescript
// React component makes API call
const response = await api.get('/api/proxy/inventory');
```

### 2. Express Server Proxy
```javascript
// Express server receives request and proxies via Dapr
app.use('/api/proxy/inventory', createServiceProxy('inventory-service', '/api/inventory'));
```

### 3. Dapr Service Invocation
```
GET /api/proxy/inventory/products
    ↓
Express Server
    ↓
Dapr Sidecar: http://localhost:3500/v1.0/invoke/inventory-service/method/api/inventory/products
    ↓
Inventory Service: http://inventory-service:8000/api/inventory/products
```

## Key Features

### 🔒 Security
- **Helmet.js**: Sets security headers
- **CORS**: Configurable cross-origin policies
- **Input validation**: JSON parsing limits
- **Non-root user**: Container runs as unprivileged user

### 🚀 Performance
- **Compression**: Gzip compression for responses
- **Static file caching**: Efficient serving of React build
- **Request/response logging**: Performance monitoring
- **Connection pooling**: Reuses HTTP connections

### 🔧 Development Experience
- **Hot reload**: Development mode with nodemon
- **Error handling**: Comprehensive error responses
- **Health checks**: Multiple health endpoints
- **Request tracking**: Unique request IDs for debugging

### 📊 Observability
- **Structured logging**: JSON formatted logs
- **Health endpoints**: `/health` and `/api/health/detailed`
- **Performance metrics**: Request timing and memory usage
- **Dapr connectivity checks**: Monitors sidecar health

## Environment Configuration

### Development
```bash
NODE_ENV=development
PORT=3000
DAPR_HTTP_PORT=3500
```

### Production (Container Apps)
```bash
NODE_ENV=production
PORT=3000
DAPR_HTTP_PORT=3500
```

## API Endpoints

### Proxy Endpoints
- `GET|POST|PUT|DELETE /api/proxy/orders/*` → Order Service
- `GET|POST|PUT|DELETE /api/proxy/inventory/*` → Inventory Service

### Health & Monitoring
- `GET /health` → Basic health check
- `GET /api/health/detailed` → Detailed health and Dapr status

### Static Content
- `GET /*` → Serves React SPA (catch-all for client-side routing)

## Build Process

### 1. Multi-stage Docker Build
```dockerfile
# Stage 1: Install dependencies
FROM node:18-alpine AS deps
# Install React and server dependencies

# Stage 2: Build React application  
FROM node:18-alpine AS builder
# Build production React bundle

# Stage 3: Production server
FROM node:18-alpine
# Copy server code and React build
# Run Express server only
```

### 2. Local Development
```bash
# Option 1: Separate processes
npm start                    # React dev server (port 3000)
cd server && npm run dev     # Express server (port 3001)

# Option 2: Concurrent development
npm run start:dev           # Both React and Express with hot reload

# Option 3: Production simulation
npm run build               # Build React
cd server && npm start      # Serve via Express
```

## Security Considerations

### Container Security
- Non-root user execution
- Minimal base image (Alpine Linux)
- Security updates applied
- Resource limits configured

### Application Security
- Content Security Policy headers
- CORS policy enforcement
- Request size limits
- Input sanitization
- No sensitive data in logs

### Dapr Security
- Service-to-service mTLS
- API token authentication
- Network policies in Container Apps
- Secret management via Azure Key Vault

## Troubleshooting

### Common Issues

1. **Dapr Connection Failed**
   ```bash
   # Check Dapr sidecar health
   curl http://localhost:3500/v1.0/healthz
   
   # Check detailed health endpoint
   curl http://localhost:3000/api/health/detailed
   ```

2. **Static Files Not Loading**
   ```bash
   # Verify React build exists
   ls -la build/
   
   # Check file permissions
   ls -la build/static/
   ```

3. **API Proxy Errors**
   ```bash
   # Check backend service connectivity
   curl http://localhost:3500/v1.0/invoke/inventory-service/method/api/inventory
   ```

### Logging

The server provides structured logging with request IDs:
```
[2024-01-15T10:30:00.000Z] GET /api/proxy/inventory - 127.0.0.1
[abc123] 📤 Proxying GET / to inventory-service
[abc123] ✅ inventory-service responded with 200 in 45ms
```

## Best Practices

1. **Error Handling**: Always include request IDs in error responses
2. **Timeouts**: Set appropriate timeouts for Dapr calls (30s default)
3. **Retries**: Consider implementing retry logic for transient failures
4. **Monitoring**: Use health endpoints for Container Apps probes
5. **Caching**: Enable static file caching in production
6. **Security**: Regularly update dependencies and base images

## Further Reading

- [Dapr Service Invocation](https://docs.dapr.io/developing-applications/building-blocks/service-invocation/)
- [Azure Container Apps Dapr Integration](https://docs.microsoft.com/en-us/azure/container-apps/dapr-overview)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
