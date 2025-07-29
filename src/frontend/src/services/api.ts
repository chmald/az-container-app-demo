import axios from 'axios';
import { Product, Order, ApiResponse } from '../types';

// Use proxy endpoints that communicate with Dapr
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const inventoryApi = {
  getProducts: async (): Promise<Product[]> => {
    const response = await api.get('/api/proxy/inventory');
    return response.data.data || response.data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await api.get(`/api/proxy/inventory/${id}`);
    return response.data.data || response.data;
  },

  updateInventory: async (id: string, quantity: number): Promise<Product> => {
    const response = await api.put(`/api/proxy/inventory/${id}`, {
      quantity,
    });
    return response.data.data || response.data;
  },
};

export const orderApi = {
  getOrders: async (): Promise<Order[]> => {
    const response = await api.get('/api/proxy/orders');
    return response.data.data || response.data;
  },

  getOrder: async (id: string): Promise<Order> => {
    const response = await api.get(`/api/proxy/orders/${id}`);
    return response.data.data || response.data;
  },

  createOrder: async (orderData: Partial<Order>): Promise<Order> => {
    const response = await api.post('/api/proxy/orders', orderData);
    return response.data.data || response.data;
  },

  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    const response = await api.put(`/api/proxy/orders/${id}/status`, {
      status,
    });
    return response.data.data || response.data;
  },
};

export const notificationApi = {
  sendNotification: async (type: string, message: string, userId?: string): Promise<any> => {
    const response = await api.post('/api/proxy/notifications/notify', {
      type,
      message,
      userId,
    });
    return response.data;
  },

  healthCheck: async (): Promise<any> => {
    const response = await api.get('/api/proxy/notifications/health');
    return response.data;
  },
};

export default api;