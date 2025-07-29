export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed'
}

export interface Notification {
  id: string;
  type: NotificationType;
  recipient: string;
  subject?: string;
  message: string;
  data?: Record<string, any>;
  status: NotificationStatus;
  createdAt: string;
  sentAt?: string;
  error?: string;
}

export interface NotificationRequest {
  type: NotificationType;
  recipient: string;
  subject?: string;
  message: string;
  data?: Record<string, any>;
}

// Event types for DAPR pub/sub
export interface OrderCreatedEvent {
  orderId: string;
  customerId: string;
  total: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
}

export interface OrderStatusUpdatedEvent {
  orderId: string;
  status: string;
  updatedAt: string;
}

export interface InventoryAlertEvent {
  productId: string;
  productName: string;
  currentQuantity: number;
  stockLevel: string;
  threshold: number;
  timestamp: string;
}