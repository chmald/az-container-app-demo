import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { validateNotificationRequest } from '../middleware/validation';

export const notificationRoutes = Router();

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Send a notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationRequest'
 *     responses:
 *       201:
 *         description: Notification sent successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification retrieved successfully
 *       404:
 *         description: Notification not found
 */

/**
 * @swagger
 * /api/notifications/history:
 *   get:
 *     summary: Get notification history
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: recipient
 *         schema:
 *           type: string
 *         description: Filter by recipient
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of notifications to return
 *     responses:
 *       200:
 *         description: Notification history retrieved successfully
 */

// Function to initialize routes with dependencies
export const initializeNotificationRoutes = (notificationController: NotificationController): Router => {
  const router = Router();
  
  router.post('/notifications', validateNotificationRequest, notificationController.sendNotification);
  router.get('/notifications/:id', notificationController.getNotificationById);
  router.get('/notifications/history', notificationController.getNotificationHistory);
  
  return router;
};