import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { 
  validateCreateOrder, 
  validateUpdateOrderStatus, 
  validateOrderId 
} from '../middleware/validation';

// Create router and controller instances
export const orderRoutes = Router();
const orderController = new OrderController(
  // Dependencies will be injected in server.ts
  {} as any
);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 */
orderRoutes.get('/orders', orderController.getAllOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 */
orderRoutes.get('/orders/:id', validateOrderId, orderController.getOrderById);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 */
orderRoutes.post('/orders', validateCreateOrder, orderController.createOrder);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrderStatusRequest'
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       404:
 *         description: Order not found
 */
orderRoutes.put('/orders/:id/status', validateUpdateOrderStatus, orderController.updateOrderStatus);

// Function to initialize routes with dependencies
export const initializeOrderRoutes = (orderController: OrderController): Router => {
  const router = Router();
  
  router.get('/orders', orderController.getAllOrders);
  router.get('/orders/:id', validateOrderId, orderController.getOrderById);
  router.post('/orders', validateCreateOrder, orderController.createOrder);
  router.put('/orders/:id/status', validateUpdateOrderStatus, orderController.updateOrderStatus);
  
  return router;
};