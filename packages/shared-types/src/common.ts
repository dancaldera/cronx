// Common types shared across the application
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: any;
}

// HTTP related types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type AuthType = 'none' | 'bearer' | 'basic' | 'api_key';
export type ExecutionStatus = 'success' | 'failure' | 'timeout';

// User preferences
export type ThemePreference = 'light' | 'dark' | 'system';
export type TimeFormat = '12h' | '24h';

// CRON related
export interface CronSchedule {
  expression: string;
  timezone: string;
  nextRuns: Date[];
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}