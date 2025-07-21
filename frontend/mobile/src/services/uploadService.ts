import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { tempFileCleanupService } from '../utils/tempFileCleanup';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface DishPhotoUploadResult {
  url: string;
  publicId: string;
}

export interface UploadError extends Error {
  type: 'network' | 'server' | 'validation' | 'permission' | 'unknown';
  retryable: boolean;
  statusCode?: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface PerformanceMetrics {
  compressionTime: number;
  uploadTime: number;
  totalTime: number;
  originalSize: number;
  compressedSize: number;
  uploadSpeed: number; // bytes per second
  retryCount: number;
}

class UploadService {
  private readonly API_URL: string;
  private readonly DEFAULT_OPTIONS: Required<UploadOptions> = {
    onProgress: () => {},
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    quality: 0.8,
    maxWidth: 1200,
    maxHeight: 1200,
  };

  constructor() {
    this.API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000';
  }

  /**
   * Upload a dish photo with retry logic and progress tracking
   */
  async uploadDishPhoto(
    imageUri: string,
    recipeId?: string,
    options: UploadOptions = {}
  ): Promise<DishPhotoUploadResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();
    
    this.log('Starting dish photo upload', { imageUri, recipeId, options: opts });

    try {
      // Compress image before upload
      const compressionStart = Date.now();
      const compressedUri = await this.compressImage(imageUri, {
        quality: opts.quality,
        maxWidth: opts.maxWidth,
        maxHeight: opts.maxHeight,
      });
      const compressionTime = Date.now() - compressionStart;

      // Attempt upload with retry logic
      const uploadStart = Date.now();
      const result = await this.uploadWithRetry(compressedUri, recipeId, opts);
      const uploadTime = Date.now() - uploadStart;
      const totalTime = Date.now() - startTime;

      // Calculate performance metrics
      const metrics: PerformanceMetrics = {
        compressionTime,
        uploadTime,
        totalTime,
        originalSize: 0, // Will be set in compression
        compressedSize: 0, // Will be set in compression
        uploadSpeed: 0, // Will be calculated in upload
        retryCount: 0, // Will be set in retry logic
      };

      this.logPerformanceMetrics(metrics);
      
      // Unregister temp file after successful upload
      await tempFileCleanupService.unregisterTempFile(compressedUri);
      
      return result;
    } catch (error) {
      this.log('Upload failed', { error: error instanceof Error ? error.message : String(error) });
      throw this.createUploadError(error);
    }
  }

  /**
   * Compress image for optimal upload with adaptive quality
   */
  async compressImage(
    uri: string,
    options: {
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ): Promise<string> {
    const { quality = 0.8, maxWidth = 1200, maxHeight = 1200 } = options;

    try {
      this.log('Compressing image', { uri, quality, maxWidth, maxHeight });

      this.log('Getting original image info...');
      // Get original image info
      const originalInfo = await ImageManipulator.manipulateAsync(uri, [], { 
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 1.0  // No compression for info gathering
      });
      this.log('Original image info obtained', { width: originalInfo.width, height: originalInfo.height });
      
      // Calculate optimal dimensions maintaining aspect ratio
      const aspectRatio = originalInfo.width / originalInfo.height;
      let targetWidth = maxWidth;
      let targetHeight = maxHeight;
      
      if (aspectRatio > 1) {
        // Landscape
        targetHeight = Math.round(maxWidth / aspectRatio);
      } else {
        // Portrait or square
        targetWidth = Math.round(maxHeight * aspectRatio);
      }

      // Ensure we don't upscale
      targetWidth = Math.min(targetWidth, originalInfo.width);
      targetHeight = Math.min(targetHeight, originalInfo.height);

      // More aggressive adaptive quality for faster compression
      let adaptiveQuality = quality;
      const originalPixels = originalInfo.width * originalInfo.height;
      if (originalPixels > 3000000) { // > 3MP - very large images
        adaptiveQuality = 0.5; // Much lower quality for very large images
        targetWidth = Math.min(targetWidth, 800); // Smaller max size
        targetHeight = Math.min(targetHeight, 800);
      } else if (originalPixels > 2000000) { // > 2MP
        adaptiveQuality = 0.6;
        targetWidth = Math.min(targetWidth, 1000);
        targetHeight = Math.min(targetHeight, 1000);
      } else if (originalPixels > 1000000) { // > 1MP
        adaptiveQuality = Math.max(0.7, quality - 0.05);
      }

      this.log('Starting image manipulation with dimensions', { targetWidth, targetHeight, adaptiveQuality });
      
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: targetWidth,
              height: targetHeight,
            },
          },
        ],
        {
          compress: adaptiveQuality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      
      this.log('Image manipulation completed', { resultWidth: result.width, resultHeight: result.height });

      // Register compressed image for cleanup (non-blocking)
      tempFileCleanupService.registerTempFile(result.uri, 'image').catch(error => {
        console.warn('Failed to register temp file:', error);
      });

      // Calculate compression ratio
      const compressionRatio = originalPixels / (result.width * result.height);

      this.log('Image compressed successfully', { 
        originalSize: `${originalInfo.width}x${originalInfo.height}`,
        compressedSize: `${result.width}x${result.height}`,
        compressionRatio: compressionRatio.toFixed(2),
        quality: adaptiveQuality
      });
      return result.uri;
    } catch (error) {
      this.log('Image compression failed', { error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Image compression failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Upload with retry logic
   */
  private async uploadWithRetry(
    imageUri: string,
    recipeId: string | undefined,
    options: Required<UploadOptions>
  ): Promise<DishPhotoUploadResult> {
    let lastError: Error;

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        this.log(`Upload attempt ${attempt}/${options.maxRetries}`, { imageUri, recipeId });
        
        const result = await this.performUpload(imageUri, recipeId, options);
        
        this.log('Upload successful', { result, attempt });
        return result;
      } catch (error) {
        lastError = error as Error;
        const uploadError = this.createUploadError(error);
        
        this.log(`Upload attempt ${attempt} failed`, { 
          error: uploadError.message, 
          type: uploadError.type,
          retryable: uploadError.retryable 
        });

        // Don't retry if error is not retryable or this is the last attempt
        if (!uploadError.retryable || attempt === options.maxRetries) {
          throw uploadError;
        }

        // Wait before retry with exponential backoff
        const delay = options.retryDelay * Math.pow(2, attempt - 1);
        this.log(`Waiting ${delay}ms before retry`, { attempt, delay });
        await this.sleep(delay);
      }
    }

    throw this.createUploadError(lastError!);
  }

  /**
   * Perform the actual upload
   */
  private async performUpload(
    imageUri: string,
    recipeId: string | undefined,
    options: Required<UploadOptions>
  ): Promise<DishPhotoUploadResult> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const formData = new FormData();
    
    // Prepare file data
    const filename = imageUri.split('/').pop() || 'dish-photo.jpg';
    const fileType = filename.split('.').pop() || 'jpg';
    
    formData.append('dishPhoto', {
      uri: imageUri,
      type: `image/${fileType}`,
      name: filename,
    } as any);

    if (recipeId) {
      formData.append('recipeId', recipeId);
    }

    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Set timeout
      xhr.timeout = options.timeout;
      
      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          };
          options.onProgress(progress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.data) {
              resolve(response.data);
            } else {
              reject(new Error(response.error || 'Upload failed'));
            }
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error instanceof Error ? error.message : String(error)}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      // Start upload
      xhr.open('POST', `${this.API_URL}/api/upload/dish-photo`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  }

  /**
   * Get authentication token from storage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      this.log('Failed to get auth token', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Create typed upload error
   */
  private createUploadError(error: any): UploadError {
    const uploadError = new Error(error.message || 'Upload failed') as UploadError;
    
    // Determine error type and retryability
    if (error.message?.includes('Network') || error.message?.includes('timeout')) {
      uploadError.type = 'network';
      uploadError.retryable = true;
    } else if (error.message?.includes('HTTP 5')) {
      uploadError.type = 'server';
      uploadError.retryable = true;
    } else if (error.message?.includes('HTTP 4')) {
      uploadError.type = 'validation';
      uploadError.retryable = false;
    } else if (error.message?.includes('permission') || error.message?.includes('auth')) {
      uploadError.type = 'permission';
      uploadError.retryable = false;
    } else {
      uploadError.type = 'unknown';
      uploadError.retryable = true;
    }

    // Extract status code if available
    const statusMatch = error.message?.match(/HTTP (\d+)/);
    if (statusMatch) {
      uploadError.statusCode = parseInt(statusMatch[1]);
    }

    return uploadError;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log performance metrics
   */
  private logPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.log('Performance metrics', {
      compressionTime: `${metrics.compressionTime}ms`,
      uploadTime: `${metrics.uploadTime}ms`,
      totalTime: `${metrics.totalTime}ms`,
      uploadSpeed: `${(metrics.uploadSpeed / 1024).toFixed(2)} KB/s`,
      retryCount: metrics.retryCount,
    });

    // In production, send to analytics service
    if (!__DEV__) {
      // TODO: Send metrics to analytics service
      // analytics.track('dish_photo_upload_performance', metrics);
    }
  }

  /**
   * Logging utility
   */
  private log(message: string, data?: any): void {
    if (__DEV__) {
      console.log(`[UploadService] ${message}`, data || '');
    }
  }
}

// Export singleton instance
export const uploadService = new UploadService();
export default uploadService;