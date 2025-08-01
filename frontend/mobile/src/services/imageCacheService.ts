import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface CacheEntry {
  url: string;
  localPath: string;
  timestamp: number;
  size: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalSize: number;
  totalFiles: number;
  oldestEntry: number;
  newestEntry: number;
}

class ImageCacheService {
  private readonly CACHE_KEY = 'image_cache_index';
  private readonly CACHE_DIR = `${FileSystem.cacheDirectory}images/`;
  private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly CLEANUP_THRESHOLD = 0.8; // Clean when 80% full
  
  private cacheIndex: Map<string, CacheEntry> = new Map();
  private initialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize cache service
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure cache directory exists
      await FileSystem.makeDirectoryAsync(this.CACHE_DIR, { intermediates: true });
      
      // Load cache index
      await this.loadCacheIndex();
      
      // Perform initial cleanup
      await this.performMaintenance();
      
      this.initialized = true;
      this.log('Image cache initialized', { 
        totalFiles: this.cacheIndex.size,
        cacheDir: this.CACHE_DIR 
      });
    } catch (error) {
      console.log('Failed to initialize image cache:', error);
    }
  }

  /**
   * Get cached image path or download and cache
   */
  async getCachedImage(url: string): Promise<string> {
    await this.ensureInitialized();

    const cacheKey = this.getCacheKey(url);
    const cachedEntry = this.cacheIndex.get(cacheKey);

    // Check if we have a valid cached entry
    if (cachedEntry && await this.isValidCacheEntry(cachedEntry)) {
      // Update last accessed time
      cachedEntry.lastAccessed = Date.now();
      await this.saveCacheIndex();
      
      this.log('Cache hit', { url, localPath: cachedEntry.localPath });
      return cachedEntry.localPath;
    }

    // Download and cache the image
    return await this.downloadAndCache(url);
  }

  /**
   * Preload images for better UX
   */
  async preloadImages(urls: string[]): Promise<void> {
    await this.ensureInitialized();

    const preloadPromises = urls.map(async (url) => {
      try {
        await this.getCachedImage(url);
      } catch (error) {
        this.log('Preload failed', { url, error: error instanceof Error ? error.message : String(error) });
      }
    });

    await Promise.allSettled(preloadPromises);
    this.log('Preload completed', { count: urls.length });
  }

  /**
   * Download and cache image
   */
  private async downloadAndCache(url: string): Promise<string> {
    const cacheKey = this.getCacheKey(url);
    const fileName = `${cacheKey}.jpg`;
    const localPath = `${this.CACHE_DIR}${fileName}`;

    try {
      this.log('Downloading image', { url, localPath });

      // Download the image
      const downloadResult = await FileSystem.downloadAsync(url, localPath);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (!fileInfo.exists) {
        throw new Error('Downloaded file does not exist');
      }

      // Create cache entry
      const cacheEntry: CacheEntry = {
        url,
        localPath,
        timestamp: Date.now(),
        size: fileInfo.size || 0,
        lastAccessed: Date.now(),
      };

      // Update cache index
      this.cacheIndex.set(cacheKey, cacheEntry);
      await this.saveCacheIndex();

      // Check if we need cleanup
      const stats = await this.getCacheStats();
      if (stats.totalSize > this.MAX_CACHE_SIZE * this.CLEANUP_THRESHOLD) {
        await this.performCleanup();
      }

      this.log('Image cached successfully', { url, localPath, size: cacheEntry.size });
      return localPath;

    } catch (error) {
      this.log('Download failed', { url, error: error instanceof Error ? error.message : String(error) });
      
      // Clean up partial download
      try {
        await FileSystem.deleteAsync(localPath, { idempotent: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      // Return original URL as fallback
      return url;
    }
  }

  /**
   * Check if cache entry is valid
   */
  private async isValidCacheEntry(entry: CacheEntry): Promise<boolean> {
    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(entry.localPath);
      if (!fileInfo.exists) {
        return false;
      }

      // Check if entry is too old
      const age = Date.now() - entry.timestamp;
      if (age > this.MAX_CACHE_AGE) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Load cache index from storage
   */
  private async loadCacheIndex(): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem(this.CACHE_KEY);
      if (indexData) {
        const entries = JSON.parse(indexData) as Array<[string, CacheEntry]>;
        this.cacheIndex = new Map(entries);
      }
    } catch (error) {
      this.log('Failed to load cache index', { error: error instanceof Error ? error.message : String(error) });
      this.cacheIndex = new Map();
    }
  }

  /**
   * Save cache index to storage
   */
  private async saveCacheIndex(): Promise<void> {
    try {
      const entries = Array.from(this.cacheIndex.entries());
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      this.log('Failed to save cache index', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    await this.ensureInitialized();

    let totalSize = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;

    for (const entry of this.cacheIndex.values()) {
      totalSize += entry.size;
      oldestEntry = Math.min(oldestEntry, entry.timestamp);
      newestEntry = Math.max(newestEntry, entry.timestamp);
    }

    return {
      totalSize,
      totalFiles: this.cacheIndex.size,
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * Perform cache cleanup
   */
  private async performCleanup(): Promise<void> {
    this.log('Starting cache cleanup');

    const entries = Array.from(this.cacheIndex.entries());
    
    // Sort by last accessed time (oldest first)
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    const stats = await this.getCacheStats();
    const targetSize = this.MAX_CACHE_SIZE * 0.7; // Clean to 70% of max size
    let currentSize = stats.totalSize;
    let cleanedCount = 0;

    for (const [key, entry] of entries) {
      if (currentSize <= targetSize) break;

      try {
        // Delete file
        await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
        
        // Remove from index
        this.cacheIndex.delete(key);
        
        currentSize -= entry.size;
        cleanedCount++;
      } catch (error) {
        this.log('Failed to delete cached file', { 
          path: entry.localPath, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    // Save updated index
    await this.saveCacheIndex();

    this.log('Cache cleanup completed', { 
      cleanedCount, 
      newSize: currentSize,
      remainingFiles: this.cacheIndex.size 
    });
  }

  /**
   * Perform maintenance tasks
   */
  private async performMaintenance(): Promise<void> {
    const invalidEntries: string[] = [];

    // Check all entries for validity
    for (const [key, entry] of this.cacheIndex.entries()) {
      if (!await this.isValidCacheEntry(entry)) {
        invalidEntries.push(key);
      }
    }

    // Remove invalid entries
    for (const key of invalidEntries) {
      const entry = this.cacheIndex.get(key);
      if (entry) {
        try {
          await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
        } catch (error) {
          // Ignore deletion errors
        }
        this.cacheIndex.delete(key);
      }
    }

    if (invalidEntries.length > 0) {
      await this.saveCacheIndex();
      this.log('Maintenance completed', { removedEntries: invalidEntries.length });
    }
  }

  /**
   * Clear entire cache
   */
  async clearCache(): Promise<void> {
    await this.ensureInitialized();

    try {
      // Delete cache directory
      await FileSystem.deleteAsync(this.CACHE_DIR, { idempotent: true });
      
      // Recreate directory
      await FileSystem.makeDirectoryAsync(this.CACHE_DIR, { intermediates: true });
      
      // Clear index
      this.cacheIndex.clear();
      await AsyncStorage.removeItem(this.CACHE_KEY);

      this.log('Cache cleared successfully');
    } catch (error) {
      this.log('Failed to clear cache', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Generate cache key from URL
   */
  private getCacheKey(url: string): string {
    // Simple hash function for URL
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Ensure service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Logging utility
   */
  private log(message: string, data?: any): void {
    // if (__DEV__) {
    //   console.log(`[ImageCache] ${message}`, data || '');
    // }
  }
}

// Export singleton instance
export const imageCacheService = new ImageCacheService();
export default imageCacheService;