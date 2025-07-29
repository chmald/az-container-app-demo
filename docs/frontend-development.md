# Frontend Development Guide

## Quick Start

### 1. Install Dependencies
```bash
cd src/frontend
npm install
cd server
npm install
cd ..
```

### 2. Development Options

#### Option A: Full Development Mode (Recommended)
```bash
# Start React dev server + Express server concurrently
npm run start:dev
```
- React: http://localhost:3000 (with hot reload)
- Express: http://localhost:3001 (with nodemon)

#### Option B: Production Simulation
```bash
# Build React and serve via Express
npm run build
npm run start:server
```
- Everything served via Express: http://localhost:3000

#### Option C: With Dapr (Full microservices)
```bash
# Build React first
npm run build

# Start with Dapr sidecar (requires Dapr CLI)
./start-with-dapr.sh
```
- Frontend with Dapr: http://localhost:3000
- Dapr dashboard: http://localhost:8080

## Development Workflow

### Making Changes

1. **React Changes**: Edit files in `src/`, changes will hot reload
2. **Server Changes**: Edit `server/server.js`, nodemon will restart
3. **API Integration**: Use `/api/proxy/*` endpoints in React code

### Testing the API Proxy

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test detailed health (includes Dapr status)
curl http://localhost:3000/api/health/detailed

# Test proxy endpoints (requires backend services running)
curl http://localhost:3000/api/proxy/inventory
curl http://localhost:3000/api/proxy/orders
```

### Building for Production

```bash
# Build React app
npm run build

# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run
```

## File Structure

```
src/frontend/
├── package.json          # React app dependencies & scripts
├── Dockerfile           # Multi-stage production build
├── .dockerignore        # Docker build optimization
├── server/
│   ├── package.json     # Express server dependencies
│   └── server.js        # Express server with Dapr proxy
├── src/                 # React source code
│   ├── services/api.ts  # API client using proxy endpoints
│   └── ...
└── build/              # React production build (generated)
```

## Environment Variables

### Development
```bash
# .env.local (React)
REACT_APP_API_URL=http://localhost:3000

# Server environment
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

## Common Issues

### 1. Proxy Errors
**Problem**: API calls return 500 errors  
**Solution**: Check if backend services are running and Dapr is configured

### 2. Build Failures
**Problem**: npm run build fails  
**Solution**: Check for TypeScript errors and missing dependencies

### 3. Hot Reload Not Working
**Problem**: React changes don't reload  
**Solution**: Use `npm start` instead of `npm run start:server`

### 4. Dapr Connection Issues
**Problem**: Health check shows Dapr disconnected  
**Solution**: Ensure Dapr is initialized and services are running with Dapr sidecars

## API Integration

### Using the Proxy in React
```typescript
// services/api.ts
const api = axios.create({
  baseURL: '', // Empty baseURL for same-origin requests
});

// Use proxy endpoints
export const inventoryApi = {
  getProducts: () => api.get('/api/proxy/inventory'),
  getProduct: (id: string) => api.get(`/api/proxy/inventory/${id}`),
};

export const orderApi = {
  getOrders: () => api.get('/api/proxy/orders'),
  createOrder: (data: Order) => api.post('/api/proxy/orders', data),
};
```

### Adding New API Endpoints
1. Add endpoint in backend service:
```javascript
// In backend-service, add new route
app.get('/api/notifications', (req, res) => { ... });
```

2. Use existing proxy route in React:
```typescript
const notificationApi = {
  getNotifications: () => api.get('/api/proxy/notifications'),
};
```

## Performance Tips

1. **Enable caching**: Production builds cache static files for 1 day
2. **Use compression**: Gzip compression is enabled for all responses
3. **Optimize images**: Use appropriate formats and sizes
4. **Bundle analysis**: Run `npm run build` and check bundle sizes
5. **Memory monitoring**: Check `/api/health/detailed` for memory usage

## Security Notes

1. **CORS**: Configured for development, restrict for production
2. **CSP Headers**: Content Security Policy prevents XSS
3. **Input validation**: Request size limits prevent DoS
4. **Container security**: Runs as non-root user
5. **Secrets**: Never commit API keys or passwords

## Debugging

### Server Logs
The Express server provides detailed logging:
```
[2024-01-15T10:30:00.000Z] GET /api/proxy/inventory - 127.0.0.1
[abc123] 📤 Proxying GET / to backend-service
[abc123] ✅ backend-service responded with 200 in 45ms
```

### Chrome DevTools
- Network tab: Monitor API calls
- Console: Check for JavaScript errors
- Application tab: Inspect localStorage/sessionStorage

### Health Monitoring
```bash
# Basic health
curl http://localhost:3000/health

# Detailed health with Dapr status
curl http://localhost:3000/api/health/detailed | jq
```
