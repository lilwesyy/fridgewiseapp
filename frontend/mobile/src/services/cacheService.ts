import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expires: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxAge?: number; // Maximum age in milliseconds (alternative to ttl)
}

class CacheService {
  private prefix = 'cache_';
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Set item in cache with optional TTL
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || options.maxAge || this.defaultTTL;
      const timestamp = Date.now();
      const expires = timestamp + ttl;

      const cacheItem: CacheItem<T> = {
        data,
        timestamp,
        expires,
      };

      await AsyncStorage.setItem(
        this.prefix + key,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.log('Cache set error:', error);
    }
  }

  /**
   * Get item from cache if not expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(this.prefix + key);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();

      // Check if expired
      if (now > cacheItem.expires) {
        await this.delete(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.log('Cache get error:', error);
      return null;
    }
  }

  /**
   * Get item from cache regardless of expiration
   */
  async getStale<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(this.prefix + key);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      return cacheItem.data;
    } catch (error) {
      console.log('Cache getStale error:', error);
      return null;
    }
  }

  /**
   * Check if cached item exists and is valid
   */
  async has(key: string): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(this.prefix + key);
      if (!cached) return false;

      const cacheItem: CacheItem = JSON.parse(cached);
      const now = Date.now();

      return now <= cacheItem.expires;
    } catch (error) {
      console.log('Cache has error:', error);
      return false;
    }
  }

  /**
   * Delete item from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.log('Cache delete error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.log('Cache clear error:', error);
    }
  }

  /**
   * Clear expired items
   */
  async clearExpired(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      const now = Date.now();

      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const cacheItem: CacheItem = JSON.parse(cached);
          if (now > cacheItem.expires) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.log('Cache clearExpired error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalItems: number;
    expiredItems: number;
    validItems: number;
    totalSize: number; // approximate size in bytes
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      const now = Date.now();
      
      let expiredItems = 0;
      let validItems = 0;
      let totalSize = 0;

      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          totalSize += cached.length;
          const cacheItem: CacheItem = JSON.parse(cached);
          if (now > cacheItem.expires) {
            expiredItems++;
          } else {
            validItems++;
          }
        }
      }

      return {
        totalItems: cacheKeys.length,
        expiredItems,
        validItems,
        totalSize,
      };
    } catch (error) {
      console.log('Cache getStats error:', error);
      return {
        totalItems: 0,
        expiredItems: 0,
        validItems: 0,
        totalSize: 0,
      };
    }
  }
}

export const cacheService = new CacheService();

// Cache-first strategy with API fallback
export class ApiCacheService {
  constructor(
    private apiService: any,
    private cache: CacheService = cacheService
  ) {}

  /**
   * Get data with cache-first strategy
   * Returns cached data immediately if available, then updates cache in background
   */
  async getCacheFirst<T>(
    cacheKey: string,
    apiCall: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    try {
      // Try to get from cache first
      const cached = await this.cache.get<T>(cacheKey);
      if (cached) {
        // Background update
        this.updateCacheInBackground(cacheKey, apiCall, options);
        return cached;
      }

      // Fallback to API call
      const fresh = await apiCall();
      await this.cache.set(cacheKey, fresh, options);
      return fresh;
    } catch (error) {
      console.log('getCacheFirst error:', error);
      // Try to get stale data as last resort
      return await this.cache.getStale<T>(cacheKey);
    }
  }

  /**
   * Get data with network-first strategy
   * Tries API first, falls back to cache on failure
   */
  async getNetworkFirst<T>(
    cacheKey: string,
    apiCall: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    try {
      // Try API first
      const fresh = await apiCall();
      await this.cache.set(cacheKey, fresh, options);
      return fresh;
    } catch (error) {
      console.log('API call failed, trying cache:', error);
      // Fallback to cache (even if stale)
      return await this.cache.getStale<T>(cacheKey);
    }
  }

  private async updateCacheInBackground<T>(
    cacheKey: string,
    apiCall: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const fresh = await apiCall();
      await this.cache.set(cacheKey, fresh, options);
    } catch (error) {
      console.log('Background cache update failed:', error);
    }
  }
}

export default cacheService;