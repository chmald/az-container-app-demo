import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { NotificationRequest } from '../models/notification';
import { ApiResponse } from '../models/common';
import logger from '../utils/logger';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  sendNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const notificationRequest: NotificationRequest = req.body;
      const notification = await this.notificationService.sendNotification(notificationRequest);

      const response: ApiResponse = {
        success: true,
        data: notification,
        message: 'Notification sent successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Error sending notification', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to send notification'
      });
    }
  };

  getNotificationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Notification ID is required'
        });
        return;
      }

      const notification = await this.notificationService.getNotificationById(id);

      if (!notification) {
        res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: notification,
        message: 'Notification retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting notification by ID', { notificationId: req.params.id, error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve notification'
      });
    }
  };

  getNotificationHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const recipient = req.query.recipient as string;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const notifications = await this.notificationService.getNotificationHistory(recipient, limit);

      const response: ApiResponse = {
        success: true,
        data: notifications,
        message: `Retrieved ${notifications.length} notifications`
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting notification history', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve notification history'
      });
    }
  };

  healthCheck = async (req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      service: 'notification-controller',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  };
}