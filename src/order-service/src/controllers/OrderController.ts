import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { CreateOrderRequest, UpdateOrderStatusRequest, ApiResponse } from '../models/Order';
import logger from '../utils/logger';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  getAllOrders = async (req: Request, res: Response) => {
    try {
      const orders = await this.orderService.getAllOrders();
      
      const response: ApiResponse<typeof orders> = {
        success: true,
        data: orders,
        message: `Retrieved ${orders.length} orders`
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in getAllOrders controller', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve orders'
      });
    }
  };

  getOrderById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const order = await this.orderService.getOrderById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      const response: ApiResponse<typeof order> = {
        success: true,
        data: order
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in getOrderById controller', { orderId: req.params.id, error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve order'
      });
    }
  };

  createOrder = async (req: Request, res: Response) => {
    try {
      const orderRequest: CreateOrderRequest = req.body;
      const order = await this.orderService.createOrder(orderRequest);

      const response: ApiResponse<typeof order> = {
        success: true,
        data: order,
        message: 'Order created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Error in createOrder controller', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to create order'
      });
    }
  };

  updateOrderStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status }: UpdateOrderStatusRequest = req.body;
      
      const order = await this.orderService.updateOrderStatus(id, status);

      const response: ApiResponse<typeof order> = {
        success: true,
        data: order,
        message: 'Order status updated successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in updateOrderStatus controller', { 
        orderId: req.params.id, 
        error 
      });
      
      if (error instanceof Error && error.message === 'Order not found') {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update order status'
      });
    }
  };

  // Health check endpoint
  healthCheck = async (req: Request, res: Response) => {
    res.json({
      success: true,
      service: 'order-service',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  };
}