import axios from 'axios';
import { Product, Order, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3501/v1.0/invoke';

// Dapr service invocation endpoints
const ORDER_SERVICE = 'order-service';
const INVENTORY_SERVICE = 'inventory-service';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const inventoryApi = {
  getProducts: async (): Promise<Product[]> => {
    const response = await api.get(`/${INVENTORY_SERVICE}/method/api/inventory`);
    return response.data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await api.get(`/${INVENTORY_SERVICE}/method/api/inventory/${id}`);
    return response.data;
  },

  updateInventory: async (id: string, quantity: number): Promise<Product> => {
    const response = await api.put(`/${INVENTORY_SERVICE}/method/api/inventory/${id}`, {
      quantity,
    });
    return response.data;
  },
};

export const orderApi = {
  getOrders: async (): Promise<Order[]> => {
    const response = await api.get(`/${ORDER_SERVICE}/method/api/orders`);
    return response.data;
  },

  getOrder: async (id: string): Promise<Order> => {
    const response = await api.get(`/${ORDER_SERVICE}/method/api/orders/${id}`);
    return response.data;
  },

  createOrder: async (orderData: Partial<Order>): Promise<Order> => {
    const response = await api.post(`/${ORDER_SERVICE}/method/api/orders`, orderData);
    return response.data;
  },

  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    const response = await api.put(`/${ORDER_SERVICE}/method/api/orders/${id}/status`, {
      status,
    });
    return response.data;
  },
};

export default api;