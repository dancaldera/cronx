import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth-store';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const { refreshToken } = useAuthStore.getState();
            if (!refreshToken) {
              console.warn('No refresh token available, redirecting to login');
              useAuthStore.getState().logout();
              if (typeof window !== 'undefined') {
                window.location.href = '/auth/login';
              }
              return Promise.reject(error);
            }

            // Try to refresh the token
            const response = await this.client.post('/auth/refresh', {
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data;
            useAuthStore.getState().setTokens(accessToken, newRefreshToken);

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            useAuthStore.getState().logout();
            
            // Redirect to login if we're in the browser
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    console.log('🔌 API Client: Making login request', { 
      email, 
      baseURL: this.client.defaults.baseURL,
      hasPassword: !!password 
    });
    
    try {
      const response = await this.client.post('/auth/login', { email, password });
      console.log('🔌 API Client: Login response received', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      return response.data;
    } catch (error: any) {
      console.error('🔌 API Client: Login request failed', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  async register(userData: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    const response = await this.client.post('/auth/register', userData);
    return response.data;
  }

  async logout() {
    // No need to call API logout since we're using JWTs
    useAuthStore.getState().logout();
  }

  // HTTP Templates endpoints
  async getHttpTemplates() {
    const response = await this.client.get('/http-templates');
    return response.data;
  }

  async getHttpTemplate(id: string) {
    const response = await this.client.get(`/http-templates/${id}`);
    return response.data;
  }

  async createHttpTemplate(data: any) {
    const response = await this.client.post('/http-templates', data);
    return response.data;
  }

  async updateHttpTemplate(id: string, data: any) {
    const response = await this.client.put(`/http-templates/${id}`, data);
    return response.data;
  }

  async deleteHttpTemplate(id: string) {
    const response = await this.client.delete(`/http-templates/${id}`);
    return response.data;
  }

  async testHttpTemplate(id: string) {
    const response = await this.client.post(`/http-templates/${id}/test`);
    return response.data;
  }

  // CRON Jobs endpoints
  async getCronJobs() {
    const response = await this.client.get('/cron-jobs');
    return response.data;
  }

  async getCronJob(id: string) {
    const response = await this.client.get(`/cron-jobs/${id}`);
    return response.data;
  }

  async createCronJob(data: any) {
    const response = await this.client.post('/cron-jobs', data);
    return response.data;
  }

  async updateCronJob(id: string, data: any) {
    const response = await this.client.put(`/cron-jobs/${id}`, data);
    return response.data;
  }

  async deleteCronJob(id: string) {
    const response = await this.client.delete(`/cron-jobs/${id}`);
    return response.data;
  }

  async toggleCronJob(id: string, isEnabled: boolean) {
    const response = await this.client.patch(`/cron-jobs/${id}/toggle`, { isEnabled });
    return response.data;
  }

  async executeCronJob(id: string) {
    const response = await this.client.post(`/cron-jobs/${id}/execute`);
    return response.data;
  }

  // Execution Logs endpoints
  async getExecutionLogs(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await this.client.get('/execution-logs', { params });
    return response.data;
  }

  async getCronJobExecutionLogs(cronJobId: string, params?: {
    limit?: number;
    offset?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await this.client.get(`/execution-logs/cron-job/${cronJobId}`, { params });
    return response.data;
  }

  async getExecutionStats(params?: {
    cronJobId?: string;
    period?: '1d' | '7d' | '30d';
  }) {
    const response = await this.client.get('/execution-logs/stats', { params });
    return response.data;
  }

  // Generic request method for custom requests
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client(config);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();