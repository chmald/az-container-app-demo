import { Product, ProductCreate, ProductUpdate, ProductCategory } from '../models/product';
import { PaginatedResponse } from '../models/common';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { DaprService } from '../dapr/daprService';

export class InventoryService {
  private storeName = 'statestore';
  private pubsubName = 'pubsub';
  private sampleProducts: Product[] = [];

  constructor(private daprService: DaprService) {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    this.sampleProducts = [
      {
        id: 'product-001',
        name: 'Gaming Laptop',
        description: 'High-performance gaming laptop with RTX 4080',
        price: 1899.99,
        quantity: 15,
        category: ProductCategory.ELECTRONICS,
        sku: 'LAPTOP-GAMING-001',
        imageUrl: 'https://example.com/images/gaming-laptop.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'product-002',
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with RGB lighting',
        price: 29.99,
        quantity: 50,
        category: ProductCategory.ELECTRONICS,
        sku: 'MOUSE-WIRELESS-001',
        imageUrl: 'https://example.com/images/wireless-mouse.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'product-003',
        name: 'Mechanical Keyboard',
        description: 'Cherry MX Blue mechanical keyboard',
        price: 79.99,
        quantity: 25,
        category: ProductCategory.ELECTRONICS,
        sku: 'KEYBOARD-MECH-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'product-004',
        name: 'Running Shoes',
        description: 'Lightweight running shoes for athletes',
        price: 129.99,
        quantity: 8, // Low stock for demo
        category: ProductCategory.SPORTS,
        sku: 'SHOES-RUNNING-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'product-005',
        name: 'JavaScript Guide',
        description: 'Complete guide to modern JavaScript development',
        price: 39.99,
        quantity: 30,
        category: ProductCategory.BOOKS,
        sku: 'BOOK-JS-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  async getAllProducts(page = 1, pageSize = 10): Promise<PaginatedResponse<Product>> {
    try {
      // Try to get products from state store first, fallback to sample data
      let allProducts: Product[] = [];
      
      try {
        // Try to load known products from state store
        const sampleProductIds = ['product-001', 'product-002', 'product-003', 'product-004', 'product-005'];
        
        for (const productId of sampleProductIds) {
          try {
            const storedProduct = await this.daprService.getState<Product>(this.storeName, `product-${productId}`);
            if (storedProduct) {
              allProducts.push(storedProduct);
            }
          } catch (error) {
            logger.debug('Could not retrieve product from state store', { productId, error });
          }
        }
        
        // If no products in state store, initialize with sample data and save them
        if (allProducts.length === 0) {
          allProducts = [...this.sampleProducts];
          
          // Save sample products to state store for future retrieval
          for (const product of this.sampleProducts) {
            try {
              await this.daprService.saveState(this.storeName, `product-${product.id}`, product);
            } catch (error) {
              logger.warn('Could not save product to state store during initialization', { productId: product.id, error });
            }
          }
          logger.info('Initialized products in state store', { count: allProducts.length });
        }
      } catch (error) {
        logger.warn('Could not retrieve from state store, using sample data', { error });
        allProducts = [...this.sampleProducts];
      }

      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const products = allProducts.slice(start, end);

      logger.info('Retrieved products', { 
        page, 
        pageSize, 
        total: allProducts.length,
        returned: products.length,
        fromStateStore: allProducts.length > 0
      });

      return {
        success: true,
        data: products,
        total: allProducts.length,
        page,
        pageSize,
        message: `Retrieved ${products.length} products`
      };
    } catch (error) {
      logger.error('Error retrieving products', { error });
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      // Try to get from state store first
      try {
        const product = await this.daprService.getState<Product>(this.storeName, `product-${id}`);
        if (product) {
          logger.info('Retrieved product from state store', { productId: id });
          return product;
        }
      } catch (error) {
        logger.warn('Could not retrieve from state store, using sample data', { productId: id, error });
      }

      // Fallback to sample data
      const product = this.sampleProducts.find(p => p.id === id);
      
      if (product) {
        logger.info('Retrieved product by ID', { productId: id });
      } else {
        logger.warn('Product not found', { productId: id });
      }
      
      return product || null;
    } catch (error) {
      logger.error('Error retrieving product by ID', { productId: id, error });
      throw error;
    }
  }

  async createProduct(productData: ProductCreate): Promise<Product> {
    try {
      const newProduct: Product = {
        id: uuidv4(),
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to sample data
      this.sampleProducts.push(newProduct);

      // Save to state store via Dapr
      try {
        await this.daprService.saveState(this.storeName, `product-${newProduct.id}`, newProduct);
      } catch (error) {
        logger.warn('Could not save to state store, proceeding with in-memory', { error });
      }

      logger.info('Created new product', { productId: newProduct.id, name: newProduct.name });
      return newProduct;
    } catch (error) {
      logger.error('Error creating product', { error });
      throw error;
    }
  }

  async updateProduct(id: string, updateData: ProductUpdate): Promise<Product | null> {
    try {
      const product = await this.getProductById(id);
      if (!product) {
        return null;
      }

      const updatedProduct: Product = {
        ...product,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Update in sample data
      const index = this.sampleProducts.findIndex(p => p.id === id);
      if (index >= 0) {
        this.sampleProducts[index] = updatedProduct;
      }

      // Update in state store via Dapr
      try {
        await this.daprService.saveState(this.storeName, `product-${id}`, updatedProduct);
      } catch (error) {
        logger.warn('Could not update state store', { productId: id, error });
      }

      logger.info('Updated product', { productId: id });
      return updatedProduct;
    } catch (error) {
      logger.error('Error updating product', { productId: id, error });
      throw error;
    }
  }

  async updateInventory(id: string, quantity: number): Promise<Product | null> {
    try {
      const product = await this.getProductById(id);
      if (!product) {
        return null;
      }

      const oldQuantity = product.quantity;
      const updatedProduct: Product = {
        ...product,
        quantity,
        updatedAt: new Date().toISOString()
      };

      // Update in sample data
      const index = this.sampleProducts.findIndex(p => p.id === id);
      if (index >= 0) {
        this.sampleProducts[index] = updatedProduct;
      }

      // Update in state store via Dapr
      try {
        await this.daprService.saveState(this.storeName, `product-${id}`, updatedProduct);
      } catch (error) {
        logger.warn('Could not update state store', { productId: id, error });
      }

      // Check for low stock and publish alert if needed
      const lowStockThreshold = 10;
      if (quantity <= lowStockThreshold && oldQuantity > lowStockThreshold) {
        try {
          await this.daprService.publishEvent(this.pubsubName, 'inventory-alert', {
            productId: id,
            productName: product.name,
            currentQuantity: quantity,
            stockLevel: 'low',
            threshold: lowStockThreshold,
            timestamp: new Date().toISOString()
          });
          logger.info('Published low stock alert', { productId: id, quantity });
        } catch (error) {
          logger.warn('Could not publish inventory alert', { productId: id, error });
        }
      }

      logger.info('Updated inventory', { productId: id, oldQuantity, newQuantity: quantity });
      return updatedProduct;
    } catch (error) {
      logger.error('Error updating inventory', { productId: id, error });
      throw error;
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const searchTerm = query.toLowerCase();
      const products = this.sampleProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      );

      logger.info('Searched products', { query, found: products.length });
      return products;
    } catch (error) {
      logger.error('Error searching products', { query, error });
      throw error;
    }
  }

  async getLowStockProducts(threshold = 10): Promise<Product[]> {
    try {
      const lowStockProducts = this.sampleProducts.filter(product => product.quantity <= threshold);
      
      logger.info('Retrieved low stock products', { threshold, found: lowStockProducts.length });
      return lowStockProducts;
    } catch (error) {
      logger.error('Error retrieving low stock products', { threshold, error });
      throw error;
    }
  }
}