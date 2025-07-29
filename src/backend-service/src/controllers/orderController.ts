import { Request, Response } from 'express';
import { OrderService } from '../services/orderService';
import { CreateOrderRequest, UpdateOrderStatusRequest } from '../models/order';
import { ApiResponse } from '../models/common';
import logger from '../utils/logger';

export class OrderController {
  constructor(private orderService: OrderService) {}

  getAllOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const orders = await this.orderService.getAllOrders();
      
      const response: ApiResponse = {
        success: true,
        data: orders,
        message: `Retrieved ${orders.length} orders`
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting all orders', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve orders'
      });
    }
  };

  getOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
        return;
      }

      const order = await this.orderService.getOrderById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: order,
        message: 'Order retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting order by ID', { orderId: req.params.id, error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve order'
      });
    }
  };

  createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const orderRequest: CreateOrderRequest = req.body;
      const order = await this.orderService.createOrder(orderRequest);

      const response: ApiResponse = {
        success: true,
        data: order,
        message: 'Order created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Error creating order', { error });
      
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                         error instanceof Error && error.message.includes('Insufficient') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order'
      });
    }
  };

  updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
        return;
      }

      const { status }: UpdateOrderStatusRequest = req.body;
      const order = await this.orderService.updateOrderStatus(id, status);

      const response: ApiResponse = {
        success: true,
        data: order,
        message: 'Order status updated successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Error updating order status', { orderId: req.params.id, error });
      
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update order status'
      });
    }
  };

  healthCheck = async (req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      service: 'order-controller',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  };
}