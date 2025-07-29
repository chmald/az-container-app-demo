import { Router, Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { OrderCreatedEvent, OrderStatusUpdatedEvent, InventoryAlertEvent } from '../models/notification';
import logger from '../utils/logger';

export const daprRoutes = Router();

// Function to initialize DAPR routes with dependencies
export const initializeDaprRoutes = (notificationService: NotificationService): Router => {
  const router = Router();

  // DAPR subscription endpoint
  router.get('/subscribe', (req: Request, res: Response) => {
    const subscriptions = [
      {
        pubsubname: 'pubsub',
        topic: 'order-created',
        route: '/events/order-created'
      },
      {
        pubsubname: 'pubsub',
        topic: 'order-status-updated',
        route: '/events/order-status-updated'
      },
      {
        pubsubname: 'pubsub',
        topic: 'inventory-alert',
        route: '/events/inventory-alert'
      }
    ];

    logger.info('DAPR subscriptions requested', { subscriptions });
    res.json(subscriptions);
  });

  // Event handlers for DAPR pub/sub
  router.post('/events/order-created', async (req: Request, res: Response) => {
    try {
      const event: OrderCreatedEvent = req.body.data || req.body;
      logger.info('Received order created event', { orderId: event.orderId });
      
      await notificationService.handleOrderCreated(event);
      
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Error handling order created event', { error });
      res.status(500).json({ success: false, error: 'Failed to process event' });
    }
  });

  router.post('/events/order-status-updated', async (req: Request, res: Response) => {
    try {
      const event: OrderStatusUpdatedEvent = req.body.data || req.body;
      logger.info('Received order status updated event', { orderId: event.orderId, status: event.status });
      
      await notificationService.handleOrderStatusUpdated(event);
      
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Error handling order status updated event', { error });
      res.status(500).json({ success: false, error: 'Failed to process event' });
    }
  });

  router.post('/events/inventory-alert', async (req: Request, res: Response) => {
    try {
      const event: InventoryAlertEvent = req.body.data || req.body;
      logger.info('Received inventory alert event', { productId: event.productId, quantity: event.currentQuantity });
      
      await notificationService.handleInventoryAlert(event);
      
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Error handling inventory alert event', { error });
      res.status(500).json({ success: false, error: 'Failed to process event' });
    }
  });

  return router;
};