import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { OrderStatus } from '../models/order';
import { ProductCategory } from '../models/product';
import { NotificationType } from '../models/notification';

// Order validation
export const validateCreateOrder = [
  body('customerId')
    .notEmpty()
    .withMessage('Customer ID is required')
    .isString()
    .withMessage('Customer ID must be a string'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),
  
  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required for each item')
    .isString()
    .withMessage('Product ID must be a string'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  handleValidationErrors
];

export const validateUpdateOrderStatus = [
  param('id')
    .notEmpty()
    .withMessage('Order ID is required')
    .isUUID()
    .withMessage('Order ID must be a valid UUID'),
  
  body('status')
    .isIn(Object.values(OrderStatus))
    .withMessage(`Status must be one of: ${Object.values(OrderStatus).join(', ')}`),
  
  handleValidationErrors
];

export const validateOrderId = [
  param('id')
    .notEmpty()
    .withMessage('Order ID is required')
    .isUUID()
    .withMessage('Order ID must be a valid UUID'),
  
  handleValidationErrors
];

// Product validation
export const validateCreateProduct = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name must be between 1 and 200 characters'),
  
  body('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ max: 1000 })
    .withMessage('Product description must be less than 1000 characters'),
  
  body('price')
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number'),
  
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  body('category')
    .isIn(Object.values(ProductCategory))
    .withMessage(`Category must be one of: ${Object.values(ProductCategory).join(', ')}`),
  
  body('sku')
    .optional()
    .isLength({ max: 50 })
    .withMessage('SKU must be less than 50 characters'),
  
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  
  handleValidationErrors
];

export const validateUpdateProduct = [
  param('id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  
  body('name')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Product description must be less than 1000 characters'),
  
  body('price')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number'),
  
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  body('category')
    .optional()
    .isIn(Object.values(ProductCategory))
    .withMessage(`Category must be one of: ${Object.values(ProductCategory).join(', ')}`),
  
  body('sku')
    .optional()
    .isLength({ max: 50 })
    .withMessage('SKU must be less than 50 characters'),
  
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  
  handleValidationErrors
];

export const validateProductId = [
  param('id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  
  handleValidationErrors
];

export const validateInventoryUpdate = [
  param('id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  handleValidationErrors
];

// Notification validation
export const validateNotificationRequest = [
  body('type')
    .isIn(Object.values(NotificationType))
    .withMessage(`Type must be one of: ${Object.values(NotificationType).join(', ')}`),
  
  body('recipient')
    .notEmpty()
    .withMessage('Recipient is required'),
  
  body('message')
    .notEmpty()
    .withMessage('Message is required'),
  
  body('subject')
    .optional(),
  
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be an object'),
  
  handleValidationErrors
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),
  
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string'),
  
  handleValidationErrors
];

function handleValidationErrors(req: Request, res: Response, next: NextFunction): Response | void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
}