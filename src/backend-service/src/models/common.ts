export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

export interface HealthResponse {
  success: boolean;
  service: string;
  status: string;
  timestamp: string;
  version?: string;
  dapr?: {
    connected: boolean;
  };
}