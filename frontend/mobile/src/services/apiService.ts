import NetInfo from '@react-native-community/netinfo';
import { cacheService, ApiCacheService } from './cacheService';
import { secureStorage } from './secureStorage';
import { expoSecurityService } from './certificatePinning';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onRequestError?: (error: any) => any;
}

interface ResponseInterceptor {
  onResponse?: (response: Response, data: any) => any;
  onResponseError?: (error: any) => any;
}

interface RequestConfig {
  url: string;
  options: RequestInit;
}

class ApiService {
  private baseURL: string;
  private onUnauthorized?: () => void;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private isOnline: boolean = true;
  private cacheService: ApiCacheService;

  constructor() {
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000';
    this.cacheService = new ApiCacheService(this);
    this.setupNetworkMonitoring();
    this.setupDefaultInterceptors();
  }

  private setupNetworkMonitoring() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
    });
  }

  private setupDefaultInterceptors() {
    // Request interceptor for logging
    this.addRequestInterceptor({
      onRequest: (config) => {
        console.log(`🔵 API Request: ${config.options.method || 'GET'} ${config.url}`);
        return config;
      },
      onRequestError: (error) => {
        console.log('🔴 Request Interceptor Error:', error);
        throw error;
      }
    });

    // Response interceptor for logging
    this.addResponseInterceptor({
      onResponse: (response, data) => {
        console.log(`🟢 API Response: ${response.status} ${response.url}`);
        return data;
      },
      onResponseError: (error) => {
        console.log('🔴 Response Interceptor Error:', error);
        throw error;
      }
    });
  }

  // Add request interceptor
  addRequestInterceptor(interceptor: RequestInterceptor): number {
    return this.requestInterceptors.push(interceptor) - 1;
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: ResponseInterceptor): number {
    return this.responseInterceptors.push(interceptor) - 1;
  }

  // Remove interceptor by index
  removeRequestInterceptor(index: number): void {
    this.requestInterceptors.splice(index, 1);
  }

  removeResponseInterceptor(index: number): void {
    this.responseInterceptors.splice(index, 1);
  }

  // Set callback for when user gets unauthorized
  setUnauthorizedCallback(callback: () => void) {
    this.onUnauthorized = callback;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await secureStorage.getToken();
    } catch (error) {
      console.log('Error getting auth token:', error);
      return null;
    }
  }

  private async handleUnauthorized() {
    console.log('🚨 Unauthorized access detected - logging out user');

    // Clear stored auth data
    try {
      await secureStorage.removeToken();
      await secureStorage.removeUser();
    } catch (error) {
      console.log('Error clearing auth data:', error);
    }

    // Call the logout callback if set
    if (this.onUnauthorized) {
      this.onUnauthorized();
    }
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    timeout?: number
  ): Promise<ApiResponse<T>> {
    try {
      // Check network connectivity
      if (!this.isOnline) {
        return {
          success: false,
          error: 'No internet connection. Please check your network and try again.',
        };
      }

      const token = await this.getAuthToken();
      const url = `${this.baseURL}${endpoint}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

      // Add auth header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Apply request interceptors
      let requestConfig: RequestConfig = {
        url,
        options: {
          ...options,
          headers,
        }
      };

      for (const interceptor of this.requestInterceptors) {
        if (interceptor.onRequest) {
          try {
            requestConfig = await interceptor.onRequest(requestConfig);
          } catch (error) {
            if (interceptor.onRequestError) {
              interceptor.onRequestError(error);
            }
            throw error;
          }
        }
      }

      const response = await expoSecurityService.secureFetch(requestConfig.url, requestConfig.options, timeout);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        await this.handleUnauthorized();
        return {
          success: false,
          error: 'Session expired. Please log in again.',
        };
      }

      let data;
      try {
        const responseText = await response.text();
        if (!responseText) {
          data = {};
        } else if (responseText.trim().startsWith('<')) {
          // Response is HTML (likely an error page)
          console.log('🔴 Server returned HTML instead of JSON:', responseText.substring(0, 200));
          throw new Error('Server returned HTML instead of JSON. This usually indicates a server error or authentication issue.');
        } else {
          data = JSON.parse(responseText);
        }
      } catch (parseError: any) {
        console.log('🔴 JSON parsing failed:', parseError.message);
        throw new Error(`Failed to parse server response: ${parseError.message}`);
      }

      // Apply response interceptors
      let processedData = data;
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onResponse) {
          try {
            processedData = interceptor.onResponse(response, processedData) || processedData;
          } catch (error) {
            if (interceptor.onResponseError) {
              interceptor.onResponseError(error);
            }
            throw error;
          }
        }
      }

      if (!response.ok) {
        return {
          success: false,
          error: processedData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: processedData.data || processedData,
      };
    } catch (error: any) {
      // Apply response error interceptors
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onResponseError) {
          try {
            interceptor.onResponseError(error);
          } catch (interceptorError) {
            console.log('Response interceptor error:', interceptorError);
          }
        }
      }

      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, timeout?: number): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, timeout);
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Special method for multipart/form-data (file uploads)
  async uploadFile<T = any>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseURL}${endpoint}`;

      const headers: Record<string, string> = {};

      // Add auth header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await expoSecurityService.secureFetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        await this.handleUnauthorized();
        return {
          success: false,
          error: 'Session expired. Please log in again.',
        };
      }

      let data;
      try {
        const responseText = await response.text();
        if (!responseText) {
          data = {};
        } else if (responseText.trim().startsWith('<')) {
          // Response is HTML (likely an error page)
          console.log('🔴 Server returned HTML instead of JSON:', responseText.substring(0, 200));
          throw new Error('Server returned HTML instead of JSON. This usually indicates a server error or authentication issue.');
        } else {
          data = JSON.parse(responseText);
        }
      } catch (parseError: any) {
        console.log('🔴 JSON parsing failed:', parseError.message);
        throw new Error(`Failed to parse server response: ${parseError.message}`);
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error: any) {
      console.log('File upload failed:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  // Security-related methods
  async getSecurityPolicyInfo(): Promise<ApiResponse<any>> {
    return this.get('/api/security/policy-info');
  }

  async getCSPStats(): Promise<ApiResponse<any>> {
    return this.get('/api/security/csp-stats');
  }

  async getSecurityHeaders(): Promise<ApiResponse<any>> {
    return this.get('/api/security/headers-test');
  }

  // Cached API methods for better offline support
  async getCached<T>(
    endpoint: string,
    cacheKey?: string,
    ttl: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T | null> {
    const key = cacheKey || `get_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;

    if (this.isOnline) {
      return this.cacheService.getNetworkFirst(
        key,
        async () => {
          const response = await this.get<T>(endpoint);
          if (response.success) {
            return response.data!;
          }
          throw new Error(response.error || 'API call failed');
        },
        { ttl }
      );
    } else {
      // Offline - get from cache only
      return cacheService.getStale<T>(key);
    }
  }

  async getCacheFirst<T>(
    endpoint: string,
    cacheKey?: string,
    ttl: number = 5 * 60 * 1000
  ): Promise<T | null> {
    const key = cacheKey || `get_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;

    return this.cacheService.getCacheFirst(
      key,
      async () => {
        const response = await this.get<T>(endpoint);
        if (response.success) {
          return response.data!;
        }
        throw new Error(response.error || 'API call failed');
      },
      { ttl }
    );
  }

  // Cache management methods
  async clearCache(): Promise<void> {
    await cacheService.clear();
  }

  async clearExpiredCache(): Promise<void> {
    await cacheService.clearExpired();
  }

  async getCacheStats() {
    return cacheService.getStats();
  }

  // Check if we're online
  isConnected(): boolean {
    return this.isOnline;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;