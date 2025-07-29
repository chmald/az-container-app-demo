import { Request, Response } from 'express';
import { InventoryService } from '../services/inventoryService';
import { ProductCreate, ProductUpdate, InventoryUpdateRequest } from '../models/product';
import { ApiResponse, PaginatedResponse } from '../models/common';
import logger from '../utils/logger';

export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = req.query.search as string;

      let result: PaginatedResponse;

      if (search) {
        const products = await this.inventoryService.searchProducts(search);
        result = {
          success: true,
          data: products,
          total: products.length,
          page: 1,
          pageSize: products.length,
          message: `Found ${products.length} products matching '${search}'`
        };
      } else {
        result = await this.inventoryService.getAllProducts(page, pageSize);
      }

      res.json(result);
    } catch (error) {
      logger.error('Error getting products', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve products'
      });
    }
  };

  getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
        return;
      }

      const product = await this.inventoryService.getProductById(id);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: product,
        message: 'Product retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting product by ID', { productId: req.params.id, error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve product'
      });
    }
  };

  createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const productData: ProductCreate = req.body;
      const product = await this.inventoryService.createProduct(productData);

      const response: ApiResponse = {
        success: true,
        data: product,
        message: 'Product created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Error creating product', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to create product'
      });
    }
  };

  updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
        return;
      }

      const updateData: ProductUpdate = req.body;
      const product = await this.inventoryService.updateProduct(id, updateData);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: product,
        message: 'Product updated successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Error updating product', { productId: req.params.id, error });
      res.status(500).json({
        success: false,
        error: 'Failed to update product'
      });
    }
  };

  updateInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
        return;
      }

      const { quantity }: InventoryUpdateRequest = req.body;
      const product = await this.inventoryService.updateInventory(id, quantity);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: product,
        message: 'Inventory updated successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Error updating inventory', { productId: req.params.id, error });
      res.status(500).json({
        success: false,
        error: 'Failed to update inventory'
      });
    }
  };

  getLowStockProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const threshold = parseInt(req.query.threshold as string) || 10;
      const products = await this.inventoryService.getLowStockProducts(threshold);

      const response: ApiResponse = {
        success: true,
        data: products,
        message: `Found ${products.length} products with stock <= ${threshold}`
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting low stock products', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve low stock products'
      });
    }
  };

  healthCheck = async (req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      service: 'inventory-controller',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  };
}