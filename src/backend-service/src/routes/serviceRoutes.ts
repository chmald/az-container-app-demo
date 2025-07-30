import { Router, Request, Response } from 'express';
import { DaprService } from '../dapr/daprService';
import logger from '../utils/logger';

export const initializeServiceRoutes = (daprService: DaprService): Router => {
  const router = Router();

  // Health check that can be called by other services via Dapr
  router.get('/service/health', (req: Request, res: Response) => {
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

  // Service method that can be invoked by other services
  router.post('/service/notify', async (req: Request, res: Response) => {
    try {
      const { message, recipient, type } = req.body;
      
      logger.info('Service invocation received', { message, recipient, type });
      
      // Simulate processing the notification request
      const result = {
        success: true,
        message: 'Notification request processed via service invocation',
        data: {
          recipient,
          type,
          processedAt: new Date().toISOString()
        }
      };

      res.json(result);
    } catch (error) {
      logger.error('Error processing service invocation', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to process service invocation',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Example method to invoke another service (for testing)
  router.post('/service/invoke-test', async (req: Request, res: Response) => {
    try {
      const { targetAppId, method, data } = req.body;
      
      if (!targetAppId || !method) {
        res.status(400).json({
          success: false,
          error: 'targetAppId and method are required'
        });
        return;
      }

      const result = await daprService.invokeService(targetAppId, method, data);
      
      res.json({
        success: true,
        message: 'Service invocation successful',
        result
      });
    } catch (error) {
      logger.error('Error invoking service', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to invoke service',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get Dapr metadata (useful for debugging)
  router.get('/service/dapr-metadata', async (req: Request, res: Response) => {
    try {
      // In a real implementation, you might call the Dapr metadata endpoint
      // For now, return basic info about the Dapr configuration
      res.json({
        success: true,
        dapr: {
          connected: daprService.isConnected(),
          appId: 'backend-service',
          components: {
            statestore: 'statestore',
            pubsub: 'pubsub'
          },
          subscriptions: [
            'order-created',
            'order-status-updated',
            'inventory-alert'
          ]
        }
      });
    } catch (error) {
      logger.error('Error getting Dapr metadata', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get Dapr metadata'
      });
    }
  });

  return router;
};
