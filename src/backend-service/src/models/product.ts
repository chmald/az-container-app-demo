export enum ProductCategory {
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing',
  BOOKS = 'books',
  HOME_GARDEN = 'home_garden',
  SPORTS = 'sports',
  OTHER = 'other'
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: ProductCategory;
  sku?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreate {
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: ProductCategory;
  sku?: string;
  imageUrl?: string;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  category?: ProductCategory;
  sku?: string;
  imageUrl?: string;
}

export interface InventoryUpdateRequest {
  quantity: number;
}