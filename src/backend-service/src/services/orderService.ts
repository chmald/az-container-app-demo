import { Order, OrderItem, OrderStatus, CreateOrderRequest } from '../models/order';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { DaprService } from '../dapr/daprService';
import { InventoryService } from './inventoryService';

export class OrderService {
  private storeName = 'statestore';
  private pubsubName = 'pubsub';

  constructor(
    private daprService: DaprService,
    private inventoryService: InventoryService
  ) {}

  async getAllOrders(): Promise<Order[]> {
    try {
      // Try to get all orders from state store
      const orders: Order[] = [];
      
      try {
        // In a production system, you would need to implement proper state querying
        // For demo purposes, we'll combine state store retrieval with sample data
        
        // Get sample orders and try to load them from state store
        const sampleOrderIds = ['order-001', 'order-002'];
        
        for (const orderId of sampleOrderIds) {
          try {
            const storedOrder = await this.daprService.getState<Order>(this.storeName, `order-${orderId}`);
            if (storedOrder) {
              orders.push(storedOrder);
            }
          } catch (error) {
            logger.debug('Could not retrieve order from state store', { orderId, error });
          }
        }
        
        // If no orders in state store, use sample data
        if (orders.length === 0) {
          const sampleOrders: Order[] = [
            {
              id: 'order-001',
              customerId: 'customer-001',
              items: [
                {
                  productId: 'product-001',
                  productName: 'Gaming Laptop',
                  quantity: 1,
                  price: 1899.99
                }
              ],
              total: 1899.99,
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
          orders.push(...sampleOrders);
        }
      } catch (error) {
        logger.warn('Could not retrieve from state store, using sample data', { error });
        
        // Fallback to sample data
        const sampleOrders: Order[] = [
          {
            id: 'order-001',
            customerId: 'customer-001',
            items: [
              {
                productId: 'product-001',
                productName: 'Gaming Laptop',
                quantity: 1,
                price: 1899.99
              }
            ],
            total: 1899.99,
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
        orders.push(...sampleOrders);
      }

      logger.info('Retrieved all orders', { count: orders.length, fromStateStore: orders.length > 0 });
      return orders;
    } catch (error) {
      logger.error('Error retrieving orders', { error });
      throw error;
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    try {
      // Try to get from state store first
      try {
        const order = await this.daprService.getState<Order>(this.storeName, `order-${id}`);
        if (order) {
          logger.info('Retrieved order from state store', { orderId: id });
          return order;
        }
      } catch (error) {
        logger.warn('Could not retrieve from state store, using sample data', { orderId: id, error });
      }

      // Fallback to sample data
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
      // Get product details from inventory service
      const orderItems: OrderItem[] = [];
      let total = 0;

      for (const item of orderRequest.items) {
        try {
          const product = await this.inventoryService.getProductById(item.productId);
          
          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          if (product.quantity < item.quantity) {
            throw new Error(`Insufficient inventory for product ${item.productId}`);
          }

          const orderItem: OrderItem = {
            productId: item.productId,
            productName: product.name,
            quantity: item.quantity,
            price: product.price
          };

          orderItems.push(orderItem);
          total += orderItem.price * orderItem.quantity;

          // Update inventory
          await this.inventoryService.updateInventory(item.productId, product.quantity - item.quantity);

        } catch (error) {
          logger.error('Error processing order item', { 
            productId: item.productId, 
            error: error instanceof Error ? error.message : error 
          });
          throw error;
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
        await this.daprService.saveState(this.storeName, `order-${newOrder.id}`, newOrder);
      } catch (error) {
        logger.warn('Could not save to state store, proceeding anyway', { error });
      }

      // Publish order created event
      try {
        await this.daprService.publishEvent(this.pubsubName, 'order-created', {
          orderId: newOrder.id,
          customerId: newOrder.customerId,
          total: newOrder.total,
          items: newOrder.items,
          createdAt: newOrder.createdAt
        });
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
        await this.daprService.saveState(this.storeName, `order-${id}`, updatedOrder);
      } catch (error) {
        logger.warn('Could not update state store', { orderId: id, error });
      }

      // Publish order status updated event
      try {
        await this.daprService.publishEvent(this.pubsubName, 'order-status-updated', {
          orderId: id,
          status,
          updatedAt: updatedOrder.updatedAt
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