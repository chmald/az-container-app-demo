import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { 
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
  validateInventoryUpdate,
  validatePagination
} from '../middleware/validation';

export const inventoryRoutes = Router();

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get all products with optional pagination and search
 *     tags: [Inventory]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for product name or description
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
// Will be initialized with controller in server.ts

/**
 * @swagger
 * /api/inventory/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /api/inventory:
 *   post:
 *     summary: Create a new product
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreate'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/inventory/{id}:
 *   put:
 *     summary: Update an existing product
 *     tags: [Inventory]
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
 *             $ref: '#/components/schemas/ProductUpdate'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /api/inventory/{id}/quantity:
 *   put:
 *     summary: Update product inventory quantity
 *     tags: [Inventory]
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
 *             $ref: '#/components/schemas/InventoryUpdateRequest'
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /api/inventory/alerts/low-stock:
 *   get:
 *     summary: Get products with low stock
 *     tags: [Inventory]
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Low stock threshold
 *     responses:
 *       200:
 *         description: Low stock products retrieved successfully
 */

// Function to initialize routes with dependencies
export const initializeInventoryRoutes = (inventoryController: InventoryController): Router => {
  const router = Router();
  
  router.get('/inventory', validatePagination, inventoryController.getProducts);
  router.get('/inventory/:id', validateProductId, inventoryController.getProductById);
  router.post('/inventory', validateCreateProduct, inventoryController.createProduct);
  router.put('/inventory/:id', validateUpdateProduct, inventoryController.updateProduct);
  router.put('/inventory/:id/quantity', validateInventoryUpdate, inventoryController.updateInventory);
  router.get('/inventory/alerts/low-stock', inventoryController.getLowStockProducts);
  
  return router;
};