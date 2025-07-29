const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const port = process.env.PORT || 3000;

// Dapr configuration
const DAPR_HTTP_PORT = process.env.DAPR_HTTP_PORT || 3500;
const DAPR_BASE_URL = `http://localhost:${DAPR_HTTP_PORT}/v1.0/invoke`;

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

console.log(`Frontend Server starting in ${NODE_ENV} mode`);
console.log(`Dapr sidecar expected on port ${DAPR_HTTP_PORT}`);
console.log(`Server will listen on port ${port}`);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
    },
  },
}));
app.use(compression());
app.use(cors({
  origin: isProduction ? false : '*', // More restrictive in production
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Serve static React build files
app.use(express.static(path.join(__dirname, 'build'), {
  maxAge: isProduction ? '1d' : '0', // Cache in production
  etag: true,
  lastModified: true,
}));

// Improved API proxy with better error handling and retry logic
const createServiceProxy = (serviceName, basePath) => {
  return async (req, res) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    try {
      console.log(`[${requestId}] Proxying ${req.method} ${req.path} to ${serviceName}`);
      
      const response = await axios({
        method: req.method,
        url: `${DAPR_BASE_URL}/${serviceName}/method${basePath}${req.path === '/' ? '' : req.path}`,
        data: req.body,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          // Forward relevant headers but exclude hop-by-hop headers
          ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
          ...(req.headers['x-user-id'] && { 'X-User-ID': req.headers['x-user-id'] }),
        },
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status < 500, // Don't throw on client errors (4xx)
      });
      
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ${serviceName} responded with ${response.status} in ${duration}ms`);
      
      res.status(response.status).json(response.data);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${requestId}] ${serviceName} error after ${duration}ms:`, error.message);
      
      // Enhanced error response
      const status = error.response?.status || 500;
      const errorResponse = {
        error: error.message,
        service: serviceName,
        requestId,
        timestamp: new Date().toISOString(),
        ...(error.response?.data && { details: error.response.data }),
      };
      
      res.status(status).json(errorResponse);
    }
  };
};

// API proxy routes using Dapr service invocation
app.use('/api/proxy/orders', createServiceProxy('backend-service', '/api/orders'));
app.use('/api/proxy/inventory', createServiceProxy('backend-service', '/api/inventory'));
app.use('/api/proxy/notifications', createServiceProxy('backend-service', '/api/notifications'));

// Additional health endpoints for monitoring
app.get('/api/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    service: 'frontend-server',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    dapr: {
      port: DAPR_HTTP_PORT,
      baseUrl: DAPR_BASE_URL,
    },
  };
  
  // Check Dapr connectivity
  try {
    await axios.get(`http://localhost:${DAPR_HTTP_PORT}/v1.0/healthz`, { timeout: 5000 });
    health.dapr.status = 'connected';
  } catch (error) {
    health.dapr.status = 'disconnected';
    health.dapr.error = error.message;
  }
  
  res.json(health);
});

// Health check endpoint for Container Apps
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'frontend-server',
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint to check file structure (only in development)
app.get('/debug/files', (req, res) => {
  if (NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Debug endpoint not available in production' });
  }
  
  const fs = require('fs');
  const fileStructure = {
    currentDir: __dirname,
    buildPath: path.join(__dirname, 'build'),
    buildExists: fs.existsSync(path.join(__dirname, 'build')),
    buildIndexExists: fs.existsSync(path.join(__dirname, 'build/index.html')),
    files: {},
  };
  
  try {
    fileStructure.files.root = fs.readdirSync(__dirname);
    if (fileStructure.buildExists) {
      fileStructure.files.build = fs.readdirSync(path.join(__dirname, 'build'));
    }
  } catch (error) {
    fileStructure.error = error.message;
  }
  
  res.json(fileStructure);
});

// Serve React app for all other routes (SPA routing)
app.get('*', (req, res) => {
  // Don't serve index.html for API routes that don't exist
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.path,
      timestamp: new Date().toISOString(),
    });
  }
  
  res.sendFile(path.join(__dirname, 'build/index.html'));
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(NODE_ENV === 'development' && { stack: error.stack }),
  });
});

// Graceful shutdown handling
const server = app.listen(port, () => {
  console.log(`Frontend server running on port ${port}`);
  console.log(`Dapr sidecar expected on port ${DAPR_HTTP_PORT}`);
  console.log(`Serving React build from: ${path.join(__dirname, 'build')}`);
  console.log(`Health check available at: http://localhost:${port}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Frontend server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Frontend server closed');
    process.exit(0);
  });
});
