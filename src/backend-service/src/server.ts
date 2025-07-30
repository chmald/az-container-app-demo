import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

import { initializeOrderRoutes } from './routes/orderRoutes';
import { initializeInventoryRoutes } from './routes/inventoryRoutes';
import { initializeNotificationRoutes } from './routes/notificationRoutes';
import { initializeDaprRoutes } from './routes/daprRoutes';
import { initializeServiceRoutes } from './routes/serviceRoutes';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler';
import logger from './utils/logger';
import { DaprService } from './dapr/daprService';
import { OrderService } from './services/orderService';
import { InventoryService } from './services/inventoryService';
import { NotificationService } from './services/notificationService';
import { OrderController } from './controllers/orderController';
import { InventoryController } from './controllers/inventoryController';
import { NotificationController } from './controllers/notificationController';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize DAPR service
const daprService = new DaprService();

// Initialize services
const inventoryService = new InventoryService(daprService);
const notificationService = new NotificationService(daprService);
const orderService = new OrderService(daprService, inventoryService);

// Initialize controllers
const orderController = new OrderController(orderService);
const inventoryController = new InventoryController(inventoryService);
const notificationController = new NotificationController(notificationService);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Backend Service API',
      version: '1.0.0',
      description: 'Consolidated backend service with order, inventory, and notification functionality',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Make DAPR service available to routes
app.use((req, res, next) => {
  (req as any).daprService = daprService;
  next();
});

// Initialize and use API routes
const orderRoutes = initializeOrderRoutes(orderController);
const inventoryRoutes = initializeInventoryRoutes(inventoryController);
const notificationRoutes = initializeNotificationRoutes(notificationController);
const daprRoutes = initializeDaprRoutes(notificationService);
const serviceRoutes = initializeServiceRoutes(daprService);

app.use('/api', orderRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', notificationRoutes);
app.use('/dapr', daprRoutes);
app.use('/dapr', serviceRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'backend-service',
    message: 'Consolidated Backend Service is running',
    version: '1.0.0',
    endpoints: {
      orders: '/api/orders',
      inventory: '/api/inventory',
      notifications: '/api/notifications',
      docs: '/api/docs',
      health: '/health',
      dapr: {
        subscribe: '/dapr/subscribe',
        service: '/dapr/service',
        metadata: '/dapr/service/dapr-metadata'
      }
    },
    dapr: {
      enabled: true,
      appId: 'backend-service',
      connected: daprService.isConnected(),
      components: ['statestore', 'pubsub'],
      features: ['state-management', 'pub-sub', 'service-invocation']
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'backend-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dapr: {
      connected: daprService.isConnected()
    }
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Initialize DAPR connection
    await daprService.initialize();
    
    app.listen(PORT, () => {
      logger.info(`Backend Service running on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await daprService.dispose();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await daprService.dispose();
  process.exit(0);
});

startServer();

export default app;