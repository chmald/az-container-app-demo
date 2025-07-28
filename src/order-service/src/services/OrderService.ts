import { DaprClient } from '@dapr/dapr';
import { Order, OrderItem, OrderStatus, CreateOrderRequest } from '../models/Order';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export class OrderService {
  private daprClient: DaprClient;
  private storeName = 'statestore';

  constructor() {
    this.daprClient = new DaprClient();
  }

  async getAllOrders(): Promise<Order[]> {
    try {
      // In a real implementation, this would query the state store
      // For demo purposes, return sample data
      const sampleOrders: Order[] = [
        {
          id: 'order-001',
          customerId: 'customer-001',
          items: [
            {
              productId: 'product-001',
              productName: 'Laptop',
              quantity: 1,
              price: 999.99
            }
          ],
          total: 999.99,
          status: OrderStatus.CONFIRMED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'order-002',
          customerId: 'customer-002',
          items: [
            {
              productId: 'product-002',
              productName: 'Wireless Mouse',
              quantity: 2,
              price: 29.99
            }
          ],
          total: 59.98,
          status: OrderStatus.SHIPPED,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      logger.info('Retrieved all orders', { count: sampleOrders.length });
      return sampleOrders;
    } catch (error) {
      logger.error('Error retrieving orders', { error });
      throw error;
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    try {
      // In a real implementation, this would use Dapr state store
      const orders = await this.getAllOrders();
      const order = orders.find(o => o.id === id);
      
      if (order) {
        logger.info('Retrieved order by ID', { orderId: id });
      } else {
        logger.warn('Order not found', { orderId: id });
      }
      
      return order || null;
    } catch (error) {
      logger.error('Error retrieving order by ID', { orderId: id, error });
      throw error;
    }
  }

  async createOrder(orderRequest: CreateOrderRequest): Promise<Order> {
    try {
      // Get product details from inventory service via Dapr
      const orderItems: OrderItem[] = [];
      let total = 0;

      for (const item of orderRequest.items) {
        try {
          // Invoke inventory service through Dapr
          const productResponse = await this.daprClient.invoker.invoke(
            'inventory-service',
            `api/inventory/${item.productId}`,
            'GET'
          );

          const product = productResponse;
          const orderItem: OrderItem = {
            productId: item.productId,
            productName: product.name || `Product ${item.productId}`,
            quantity: item.quantity,
            price: product.price || 0
          };

          orderItems.push(orderItem);
          total += orderItem.price * orderItem.quantity;
        } catch (error) {
          logger.warn('Could not fetch product details, using defaults', { 
            productId: item.productId, 
            error 
          });
          
          // Fallback with default values
          const orderItem: OrderItem = {
            productId: item.productId,
            productName: `Product ${item.productId}`,
            quantity: item.quantity,
            price: 10.00 // Default price
          };

          orderItems.push(orderItem);
          total += orderItem.price * orderItem.quantity;
        }
      }

      const newOrder: Order = {
        id: uuidv4(),
        customerId: orderRequest.customerId,
        items: orderItems,
        total,
        status: OrderStatus.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to state store via Dapr
      try {
        await this.daprClient.state.save(this.storeName, [
          {
            key: `order-${newOrder.id}`,
            value: newOrder
          }
        ]);
      } catch (error) {
        logger.warn('Could not save to state store, proceeding with in-memory', { error });
      }

      // Publish order created event
      try {
        await this.daprClient.pubsub.publish('pubsub', 'order-created', newOrder);
        logger.info('Published order created event', { orderId: newOrder.id });
      } catch (error) {
        logger.warn('Could not publish order created event', { orderId: newOrder.id, error });
      }

      logger.info('Created new order', { orderId: newOrder.id, total: newOrder.total });
      return newOrder;
    } catch (error) {
      logger.error('Error creating order', { error });
      throw error;
    }
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    try {
      const order = await this.getOrderById(id);
      if (!order) {
        throw new Error('Order not found');
      }

      const updatedOrder: Order = {
        ...order,
        status,
        updatedAt: new Date().toISOString()
      };

      // Update in state store via Dapr
      try {
        await this.daprClient.state.save(this.storeName, [
          {
            key: `order-${id}`,
            value: updatedOrder
          }
        ]);
      } catch (error) {
        logger.warn('Could not update state store', { orderId: id, error });
      }

      // Publish order status updated event
      try {
        await this.daprClient.pubsub.publish('pubsub', 'order-status-updated', {
          orderId: id,
          status,
          order: updatedOrder
        });
        logger.info('Published order status updated event', { orderId: id, status });
      } catch (error) {
        logger.warn('Could not publish order status updated event', { orderId: id, error });
      }

      logger.info('Updated order status', { orderId: id, status });
      return updatedOrder;
    } catch (error) {
      logger.error('Error updating order status', { orderId: id, status, error });
      throw error;
    }
  }
}