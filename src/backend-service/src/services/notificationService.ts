import { 
  Notification, 
  NotificationRequest, 
  NotificationType, 
  NotificationStatus,
  OrderCreatedEvent,
  OrderStatusUpdatedEvent,
  InventoryAlertEvent
} from '../models/notification';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { DaprService } from '../dapr/daprService';

export class NotificationService {
  private storeName = 'statestore';

  constructor(private daprService: DaprService) {}

  async sendNotification(request: NotificationRequest): Promise<Notification> {
    try {
      const notification: Notification = {
        id: uuidv4(),
        ...request,
        status: NotificationStatus.PENDING,
        createdAt: new Date().toISOString()
      };

      // Save notification to state store
      try {
        await this.daprService.saveState(this.storeName, `notification-${notification.id}`, notification);
      } catch (error) {
        logger.warn('Could not save notification to state store', { notificationId: notification.id, error });
      }

      // Simulate sending notification
      const success = await this.simulateSendNotification(notification);
      
      if (success) {
        notification.status = NotificationStatus.SENT;
        notification.sentAt = new Date().toISOString();
        logger.info('Notification sent successfully', { 
          notificationId: notification.id, 
          type: notification.type,
          recipient: notification.recipient 
        });
      } else {
        notification.status = NotificationStatus.FAILED;
        notification.error = 'Failed to send notification';
        logger.error('Failed to send notification', { 
          notificationId: notification.id, 
          type: notification.type,
          recipient: notification.recipient 
        });
      }

      // Update notification status in state store
      try {
        await this.daprService.saveState(this.storeName, `notification-${notification.id}`, notification);
      } catch (error) {
        logger.warn('Could not update notification in state store', { notificationId: notification.id, error });
      }

      return notification;
    } catch (error) {
      logger.error('Error sending notification', { error });
      throw error;
    }
  }

  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      const request: NotificationRequest = {
        type: NotificationType.EMAIL,
        recipient: `customer-${event.customerId}@example.com`,
        subject: `Order Confirmation - ${event.orderId}`,
        message: `Your order ${event.orderId} has been created successfully. Total: $${event.total.toFixed(2)}`,
        data: {
          orderId: event.orderId,
          total: event.total,
          items: event.items,
          createdAt: event.createdAt
        }
      };

      await this.sendNotification(request);
      logger.info('Processed order created notification', { orderId: event.orderId });
    } catch (error) {
      logger.error('Error handling order created event', { orderId: event.orderId, error });
    }
  }

  async handleOrderStatusUpdated(event: OrderStatusUpdatedEvent): Promise<void> {
    try {
      const request: NotificationRequest = {
        type: NotificationType.EMAIL,
        recipient: `customer@example.com`, // In real app, would get from order
        subject: `Order Update - ${event.orderId}`,
        message: `Your order ${event.orderId} status has been updated to: ${event.status}`,
        data: {
          orderId: event.orderId,
          status: event.status,
          updatedAt: event.updatedAt
        }
      };

      await this.sendNotification(request);
      logger.info('Processed order status updated notification', { 
        orderId: event.orderId, 
        status: event.status 
      });
    } catch (error) {
      logger.error('Error handling order status updated event', { 
        orderId: event.orderId, 
        error 
      });
    }
  }

  async handleInventoryAlert(event: InventoryAlertEvent): Promise<void> {
    try {
      const request: NotificationRequest = {
        type: NotificationType.EMAIL,
        recipient: 'admin@example.com',
        subject: `Low Stock Alert - ${event.productName}`,
        message: `Product ${event.productName} (${event.productId}) is running low on stock. Current quantity: ${event.currentQuantity}`,
        data: {
          productId: event.productId,
          productName: event.productName,
          currentQuantity: event.currentQuantity,
          stockLevel: event.stockLevel,
          threshold: event.threshold,
          timestamp: event.timestamp
        }
      };

      await this.sendNotification(request);
      logger.info('Processed inventory alert notification', { 
        productId: event.productId,
        currentQuantity: event.currentQuantity 
      });
    } catch (error) {
      logger.error('Error handling inventory alert event', { 
        productId: event.productId, 
        error 
      });
    }
  }

  private async simulateSendNotification(notification: Notification): Promise<boolean> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate different success rates for different notification types
    const successRates = {
      [NotificationType.EMAIL]: 0.95,
      [NotificationType.SMS]: 0.9,
      [NotificationType.PUSH]: 0.85
    };

    const successRate = successRates[notification.type] || 0.9;
    const success = Math.random() < successRate;

    logger.debug('Simulated notification sending', { 
      notificationId: notification.id,
      type: notification.type,
      success,
      successRate 
    });

    return success;
  }

  async getNotificationById(id: string): Promise<Notification | null> {
    try {
      const notification = await this.daprService.getState<Notification>(this.storeName, `notification-${id}`);
      
      if (notification) {
        logger.info('Retrieved notification by ID', { notificationId: id });
      } else {
        logger.warn('Notification not found', { notificationId: id });
      }
      
      return notification;
    } catch (error) {
      logger.error('Error retrieving notification by ID', { notificationId: id, error });
      throw error;
    }
  }

  async getNotificationHistory(recipient?: string, limit = 50): Promise<Notification[]> {
    try {
      // In a real implementation, this would query the state store with filters
      // For demo purposes, return empty array
      logger.info('Retrieved notification history', { recipient, limit });
      return [];
    } catch (error) {
      logger.error('Error retrieving notification history', { recipient, error });
      throw error;
    }
  }
}