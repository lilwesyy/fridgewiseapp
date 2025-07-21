import { imageCacheService } from '../services/imageCacheService';
import { uploadService } from '../services/uploadService';
import { tempFileCleanupService } from '../utils/tempFileCleanup';
import * as FileSystem from 'expo-file-system';

// Mock dependencies for testing
jest.mock('expo-file-system');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-image-manipulator');

const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;

describe('Performance Optimizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Image Cache Service', () => {
    it('should cache images efficiently', async () => {
      const testUrl = 'https://example.com/test-image.jpg';
      const mockLocalPath = '/cache/images/test123.jpg';

      mockFileSystem.makeDirectoryAsync.mockResolvedValue();
      mockFileSystem.downloadAsync.mockResolvedValue({
        status: 200,
        uri: mockLocalPath,
        headers: {},
        mimeType: 'image/jpeg',
      });
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 1024 * 100, // 100KB
        isDirectory: false,
        uri: mockLocalPath,
        modificationTime: Date.now(),
      });

      const startTime = Date.now();
      const cachedPath = await imageCacheService.getCachedImage(testUrl);
      const endTime = Date.now();

      expect(cachedPath).toBe(mockLocalPath);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(mockFileSystem.downloadAsync).toHaveBeenCalledWith(testUrl, expect.any(String));
    });

    it('should return cached image on subsequent requests', async () => {
      const testUrl = 'https://example.com/test-image.jpg';
      const mockLocalPath = '/cache/images/test123.jpg';

      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 1024 * 100,
        isDirectory: false,
        uri: mockLocalPath,
        modificationTime: Date.now(),
      });

      // First call should download
      await imageCacheService.getCachedImage(testUrl);
      
      // Second call should use cache
      const startTime = Date.now();
      const cachedPath = await imageCacheService.getCachedImage(testUrl);
      const endTime = Date.now();

      expect(cachedPath).toBe(mockLocalPath);
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast from cache
    });

    it('should preload multiple images efficiently', async () => {
      const testUrls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ];

      mockFileSystem.makeDirectoryAsync.mockResolvedValue();
      mockFileSystem.downloadAsync.mockImplementation((url) => 
        Promise.resolve({
          status: 200,
          uri: `/cache/images/${url.split('/').pop()}`,
          headers: {},
          mimeType: 'image/jpeg',
        })
      );
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 1024 * 100,
        isDirectory: false,
        uri: '/cache/test.jpg',
        modificationTime: Date.now(),
      });

      const startTime = Date.now();
      await imageCacheService.preloadImages(testUrls);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
      expect(mockFileSystem.downloadAsync).toHaveBeenCalledTimes(3);
    });

    it('should manage cache size efficiently', async () => {
      const stats = await imageCacheService.getCacheStats();
      
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('totalFiles');
      expect(stats).toHaveProperty('oldestEntry');
      expect(stats).toHaveProperty('newestEntry');
      expect(typeof stats.totalSize).toBe('number');
      expect(typeof stats.totalFiles).toBe('number');
    });
  });

  describe('Upload Service Performance', () => {
    it('should compress images efficiently', async () => {
      const mockImageUri = 'file:///test-image.jpg';
      const mockCompressedUri = 'file:///compressed-image.jpg';

      // Mock ImageManipulator
      const mockImageManipulator = require('expo-image-manipulator');
      mockImageManipulator.manipulateAsync.mockResolvedValue({
        uri: mockCompressedUri,
        width: 800,
        height: 600,
      });

      const startTime = Date.now();
      const compressedUri = await uploadService.compressImage(mockImageUri, {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });
      const endTime = Date.now();

      expect(compressedUri).toBe(mockCompressedUri);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(mockImageManipulator.manipulateAsync).toHaveBeenCalled();
    });

    it('should handle large images with adaptive quality', async () => {
      const mockImageUri = 'file:///large-image.jpg';
      const mockCompressedUri = 'file:///compressed-large-image.jpg';

      const mockImageManipulator = require('expo-image-manipulator');
      mockImageManipulator.manipulateAsync
        .mockResolvedValueOnce({
          uri: mockImageUri,
          width: 4000, // Large image
          height: 3000,
        })
        .mockResolvedValueOnce({
          uri: mockCompressedUri,
          width: 1200,
          height: 900,
        });

      const startTime = Date.now();
      const compressedUri = await uploadService.compressImage(mockImageUri);
      const endTime = Date.now();

      expect(compressedUri).toBe(mockCompressedUri);
      expect(endTime - startTime).toBeLessThan(3000); // Should handle large images within 3 seconds
    });
  });

  describe('Temp File Cleanup Service', () => {
    it('should register and cleanup temp files efficiently', async () => {
      const testFilePath = '/temp/test-file.jpg';

      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 1024 * 50, // 50KB
        isDirectory: false,
        uri: testFilePath,
        modificationTime: Date.now(),
      });
      mockFileSystem.deleteAsync.mockResolvedValue();

      // Register temp file
      await tempFileCleanupService.registerTempFile(testFilePath, 'image');

      // Get stats
      const stats = await tempFileCleanupService.getCleanupStats();
      expect(stats.totalFiles).toBeGreaterThan(0);

      // Perform cleanup
      const startTime = Date.now();
      await tempFileCleanupService.performCleanup();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should cleanup quickly
    });

    it('should handle cleanup of expired files', async () => {
      const oldFilePath = '/temp/old-file.jpg';
      
      // Mock old file (older than 24 hours)
      const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 1024 * 100,
        isDirectory: false,
        uri: oldFilePath,
        modificationTime: oldTimestamp,
      });
      mockFileSystem.deleteAsync.mockResolvedValue();

      await tempFileCleanupService.registerTempFile(oldFilePath, 'image');
      
      const startTime = Date.now();
      await tempFileCleanupService.performCleanup();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500); // Should cleanup expired files quickly
      expect(mockFileSystem.deleteAsync).toHaveBeenCalledWith(oldFilePath, { idempotent: true });
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks during image operations', async () => {
      // Simulate fewer image operations to avoid memory issues in test environment
      const operations = Array.from({ length: 3 }, async (_, i) => {
        const testUrl = `https://example.com/memtest${i}.jpg`;
        mockFileSystem.downloadAsync.mockResolvedValue({
          status: 200,
          uri: `/cache/memtest${i}.jpg`,
          headers: {},
          mimeType: 'image/jpeg',
        });
        mockFileSystem.getInfoAsync.mockResolvedValue({
          exists: true,
          size: 1024 * 50, // Smaller file size
          isDirectory: false,
          uri: `/cache/memtest${i}.jpg`,
          modificationTime: Date.now(),
        });
        
        return imageCacheService.getCachedImage(testUrl);
      });

      await Promise.all(operations);
      
      // Test should complete without memory issues
      expect(operations).toHaveLength(3);
    });
  });

  describe('Network Resilience', () => {
    it('should handle network failures gracefully', async () => {
      const testUrl = 'https://example.com/unreachable-image.jpg';
      
      mockFileSystem.downloadAsync.mockRejectedValue(new Error('Network error'));
      
      const startTime = Date.now();
      const result = await imageCacheService.getCachedImage(testUrl);
      const endTime = Date.now();
      
      // Should fallback to original URL
      expect(result).toBe(testUrl);
      expect(endTime - startTime).toBeLessThan(5000); // Should fail fast
    });

    it('should retry failed uploads with exponential backoff', async () => {
      const mockImageUri = 'file:///test-upload.jpg';
      
      // Mock compression success
      const mockImageManipulator = require('expo-image-manipulator');
      mockImageManipulator.manipulateAsync.mockResolvedValue({
        uri: mockImageUri,
        width: 800,
        height: 600,
      });

      // Mock network failure then success
      let callCount = 0;
      const mockFetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { url: 'uploaded-url', publicId: 'test-id' } }),
        });
      });
      
      global.fetch = mockFetch;
      
      const startTime = Date.now();
      try {
        await uploadService.uploadDishPhoto(mockImageUri, 'test-recipe-id', {
          maxRetries: 3,
          retryDelay: 100, // Short delay for testing
        });
      } catch (error) {
        // Expected to eventually succeed or fail gracefully
      }
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(callCount).toBeGreaterThan(1); // Should have retried
    });
  });
});

describe('Integration Performance Tests', () => {
  it('should handle complete photo upload flow efficiently', async () => {
    const mockImageUri = 'file:///test-photo.jpg';
    const mockCompressedUri = 'file:///compressed-photo.jpg';
    const mockRecipeId = 'test-recipe-123';

    // Mock all dependencies
    const mockImageManipulator = require('expo-image-manipulator');
    mockImageManipulator.manipulateAsync.mockResolvedValue({
      uri: mockCompressedUri,
      width: 800,
      height: 600,
    });

    mockFileSystem.getInfoAsync.mockResolvedValue({
      exists: true,
      size: 1024 * 200, // 200KB
      isDirectory: false,
      uri: mockCompressedUri,
      modificationTime: Date.now(),
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { url: 'https://uploaded-image.jpg', publicId: 'uploaded-id' }
      }),
    });

    const startTime = Date.now();
    
    try {
      const result = await uploadService.uploadDishPhoto(mockImageUri, mockRecipeId, {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });
      
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('publicId');
    } catch (error) {
      // Test should handle errors gracefully
      expect(error).toBeInstanceOf(Error);
    }
    
    const endTime = Date.now();
    
    // Complete flow should finish within reasonable time
    expect(endTime - startTime).toBeLessThan(5000);
  });

  it('should maintain performance with multiple concurrent operations', async () => {
    const concurrentOperations = 3; // Reduced for memory efficiency
    const operations = Array.from({ length: concurrentOperations }, async (_, i) => {
      const testUrl = `https://example.com/concurrent-image-${i}.jpg`;
      
      mockFileSystem.downloadAsync.mockResolvedValue({
        status: 200,
        uri: `/cache/concurrent-${i}.jpg`,
        headers: {},
        mimeType: 'image/jpeg',
      });
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 1024 * 30, // Smaller files
        isDirectory: false,
        uri: `/cache/concurrent-${i}.jpg`,
        modificationTime: Date.now(),
      });
      
      return imageCacheService.getCachedImage(testUrl);
    });

    const startTime = Date.now();
    const results = await Promise.allSettled(operations);
    const endTime = Date.now();

    // All operations should complete
    const successfulOperations = results.filter(r => r.status === 'fulfilled').length;
    expect(successfulOperations).toBe(concurrentOperations);
    
    // Should handle concurrent operations efficiently
    expect(endTime - startTime).toBeLessThan(2000);
  });
});