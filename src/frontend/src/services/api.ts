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
  getProducts: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<Product[]> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get(`/api/proxy/inventory?${queryParams}`);
    return response.data.data || response.data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await api.get(`/api/proxy/inventory/${id}`);
    return response.data.data || response.data;
  },

  createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
    const response = await api.post('/api/proxy/inventory', product);
    return response.data.data || response.data;
  },

  updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
    const response = await api.put(`/api/proxy/inventory/${id}`, product);
    return response.data.data || response.data;
  },

  updateInventoryQuantity: async (id: string, quantity: number): Promise<Product> => {
    const response = await api.put(`/api/proxy/inventory/${id}/quantity`, {
      quantity,
    });
    return response.data.data || response.data;
  },

  getLowStockProducts: async (threshold?: number): Promise<Product[]> => {
    const queryParams = threshold ? `?threshold=${threshold}` : '';
    const response = await api.get(`/api/proxy/inventory/alerts/low-stock${queryParams}`);
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
  sendNotification: async (notificationData: {
    type: string;
    message: string;
    recipient?: string;
    metadata?: any;
  }): Promise<any> => {
    const response = await api.post('/api/proxy/notifications', notificationData);
    return response.data;
  },

  getNotification: async (id: string): Promise<any> => {
    const response = await api.get(`/api/proxy/notifications/${id}`);
    return response.data.data || response.data;
  },

  getNotificationHistory: async (params?: {
    recipient?: string;
    limit?: number;
  }): Promise<any[]> => {
    const queryParams = new URLSearchParams();
    if (params?.recipient) queryParams.append('recipient', params.recipient);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await api.get(`/api/proxy/notifications/history?${queryParams}`);
    return response.data.data || response.data;
  },

  healthCheck: async (): Promise<any> => {
    const response = await api.get('/api/proxy/service/health');
    return response.data;
  },
};

export const serviceApi = {
  healthCheck: async (): Promise<any> => {
    const response = await api.get('/api/proxy/health');
    return response.data;
  },

  serviceInvoke: async (method: string, data?: any): Promise<any> => {
    const response = await api.post(`/api/proxy/service/${method}`, data);
    return response.data;
  },

  getDaprMetadata: async (): Promise<any> => {
    const response = await api.get('/api/proxy/service/dapr-metadata');
    return response.data;
  },
};

export default api;