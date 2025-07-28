import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { OrderStatus } from '../models/Order';

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

function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
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