import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TempFileEntry {
  path: string;
  timestamp: number;
  type: 'image' | 'cache' | 'temp';
}

class TempFileCleanupService {
  private readonly TEMP_FILES_KEY = 'temp_files_registry';
  private readonly MAX_TEMP_FILE_AGE = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  
  private tempFiles: Map<string, TempFileEntry> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize cleanup service
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.loadTempFileRegistry();
      
      // Set initialized to true BEFORE calling performCleanup to avoid infinite loop
      this.initialized = true;
      
      await this.performCleanupInternal();
      this.startPeriodicCleanup();
      
      this.log('Temp file cleanup service initialized', { 
        registeredFiles: this.tempFiles.size 
      });
    } catch (error) {
      console.log('Failed to initialize temp file cleanup:', error);
      this.initialized = false; // Reset on error
    }
  }

  /**
   * Register a temporary file for cleanup
   */
  async registerTempFile(
    filePath: string, 
    type: 'image' | 'cache' | 'temp' = 'temp'
  ): Promise<void> {
    await this.ensureInitialized();

    const entry: TempFileEntry = {
      path: filePath,
      timestamp: Date.now(),
      type,
    };

    this.tempFiles.set(filePath, entry);
    await this.saveTempFileRegistry();

    this.log('Registered temp file', { filePath, type });
  }

  /**
   * Unregister a temporary file (when it's no longer temporary)
   */
  async unregisterTempFile(filePath: string): Promise<void> {
    await this.ensureInitialized();

    if (this.tempFiles.has(filePath)) {
      this.tempFiles.delete(filePath);
      await this.saveTempFileRegistry();
      this.log('Unregistered temp file', { filePath });
    }
  }

  /**
   * Clean up expired temporary files
   */
  async performCleanup(): Promise<void> {
    await this.ensureInitialized();
    await this.performCleanupInternal();
  }

  /**
   * Internal cleanup function that doesn't call ensureInitialized
   */
  private async performCleanupInternal(): Promise<void> {
    const now = Date.now();
    const expiredFiles: string[] = [];
    let cleanedCount = 0;
    let cleanedSize = 0;

    for (const [filePath, entry] of this.tempFiles.entries()) {
      const age = now - entry.timestamp;
      
      if (age > this.MAX_TEMP_FILE_AGE) {
        try {
          // Check if file exists and get size
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          if (fileInfo.exists) {
            cleanedSize += fileInfo.size || 0;
            await FileSystem.deleteAsync(filePath, { idempotent: true });
          }
          
          expiredFiles.push(filePath);
          cleanedCount++;
        } catch (error) {
          this.log('Failed to delete temp file', { 
            filePath, 
            error: error instanceof Error ? error.message : String(error) 
          });
          // Still remove from registry even if deletion failed
          expiredFiles.push(filePath);
        }
      }
    }

    // Remove expired files from registry
    for (const filePath of expiredFiles) {
      this.tempFiles.delete(filePath);
    }

    if (expiredFiles.length > 0) {
      await this.saveTempFileRegistry();
      this.log('Cleanup completed', { 
        cleanedCount, 
        cleanedSize: `${(cleanedSize / 1024 / 1024).toFixed(2)} MB`,
        remainingFiles: this.tempFiles.size 
      });
    }
  }

  /**
   * Clean up all temporary files immediately
   */
  async cleanupAll(): Promise<void> {
    await this.ensureInitialized();

    let cleanedCount = 0;
    let cleanedSize = 0;

    for (const [filePath, entry] of this.tempFiles.entries()) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
          cleanedSize += fileInfo.size || 0;
          await FileSystem.deleteAsync(filePath, { idempotent: true });
        }
        cleanedCount++;
      } catch (error) {
        this.log('Failed to delete temp file', { 
          filePath, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    // Clear registry
    this.tempFiles.clear();
    await this.saveTempFileRegistry();

    this.log('All temp files cleaned', { 
      cleanedCount, 
      cleanedSize: `${(cleanedSize / 1024 / 1024).toFixed(2)} MB` 
    });
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile: number;
    newestFile: number;
    filesByType: Record<string, number>;
  }> {
    await this.ensureInitialized();

    let totalSize = 0;
    let oldestFile = Date.now();
    let newestFile = 0;
    const filesByType: Record<string, number> = {};

    for (const [filePath, entry] of this.tempFiles.entries()) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
          totalSize += fileInfo.size || 0;
        }
      } catch (error) {
        // File might not exist, ignore
      }

      oldestFile = Math.min(oldestFile, entry.timestamp);
      newestFile = Math.max(newestFile, entry.timestamp);
      filesByType[entry.type] = (filesByType[entry.type] || 0) + 1;
    }

    return {
      totalFiles: this.tempFiles.size,
      totalSize,
      oldestFile,
      newestFile,
      filesByType,
    };
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.performCleanupInternal().catch(error => {
        console.log('Periodic cleanup failed:', error);
      });
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop periodic cleanup
   */
  stopPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Load temp file registry from storage
   */
  private async loadTempFileRegistry(): Promise<void> {
    try {
      const registryData = await AsyncStorage.getItem(this.TEMP_FILES_KEY);
      if (registryData) {
        const entries = JSON.parse(registryData) as Array<[string, TempFileEntry]>;
        this.tempFiles = new Map(entries);
      }
    } catch (error) {
      this.log('Failed to load temp file registry', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      this.tempFiles = new Map();
    }
  }

  /**
   * Save temp file registry to storage
   */
  private async saveTempFileRegistry(): Promise<void> {
    try {
      const entries = Array.from(this.tempFiles.entries());
      await AsyncStorage.setItem(this.TEMP_FILES_KEY, JSON.stringify(entries));
    } catch (error) {
      this.log('Failed to save temp file registry', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
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
    //   console.log(`[TempFileCleanup] ${message}`, data || '');
    // }
  }

  /**
   * Cleanup on app termination
   */
  async cleanup(): Promise<void> {
    this.stopPeriodicCleanup();
    await this.performCleanupInternal();
  }
}

// Export singleton instance
export const tempFileCleanupService = new TempFileCleanupService();
export default tempFileCleanupService;