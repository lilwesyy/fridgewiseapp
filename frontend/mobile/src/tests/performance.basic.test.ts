/**
 * Basic performance tests to verify optimization implementations
 * These tests focus on functionality rather than intensive performance testing
 */

describe('Performance Optimizations - Basic Tests', () => {
  describe('Image Cache Service', () => {
    it('should export imageCacheService', () => {
      const { imageCacheService } = require('../services/imageCacheService');
      expect(imageCacheService).toBeDefined();
      expect(typeof imageCacheService.getCachedImage).toBe('function');
      expect(typeof imageCacheService.preloadImages).toBe('function');
      expect(typeof imageCacheService.getCacheStats).toBe('function');
    });
  });

  describe('Upload Service Enhancements', () => {
    it('should export enhanced uploadService with performance metrics', () => {
      const { uploadService } = require('../services/uploadService');
      expect(uploadService).toBeDefined();
      expect(typeof uploadService.uploadDishPhoto).toBe('function');
      expect(typeof uploadService.compressImage).toBe('function');
    });
  });

  describe('Temp File Cleanup Service', () => {
    it('should export tempFileCleanupService', () => {
      const { tempFileCleanupService } = require('../utils/tempFileCleanup');
      expect(tempFileCleanupService).toBeDefined();
      expect(typeof tempFileCleanupService.registerTempFile).toBe('function');
      expect(typeof tempFileCleanupService.performCleanup).toBe('function');
      expect(typeof tempFileCleanupService.getCleanupStats).toBe('function');
    });
  });

  describe('Service Integration', () => {
    it('should export all services from index', () => {
      const services = require('../services/index');
      expect(services.uploadService).toBeDefined();
      expect(services.imageCacheService).toBeDefined();
    });
  });
});

describe('Performance Features Verification', () => {
  it('should have image caching capabilities', () => {
    const { imageCacheService } = require('../services/imageCacheService');
    
    // Verify key methods exist
    expect(imageCacheService.getCachedImage).toBeDefined();
    expect(imageCacheService.preloadImages).toBeDefined();
    expect(imageCacheService.clearCache).toBeDefined();
  });

  it('should have temp file cleanup capabilities', () => {
    const { tempFileCleanupService } = require('../utils/tempFileCleanup');
    
    // Verify key methods exist
    expect(tempFileCleanupService.registerTempFile).toBeDefined();
    expect(tempFileCleanupService.unregisterTempFile).toBeDefined();
    expect(tempFileCleanupService.performCleanup).toBeDefined();
    expect(tempFileCleanupService.cleanupAll).toBeDefined();
  });

  it('should have enhanced upload service with compression', () => {
    const { uploadService } = require('../services/uploadService');
    
    // Verify enhanced methods exist
    expect(uploadService.uploadDishPhoto).toBeDefined();
    expect(uploadService.compressImage).toBeDefined();
  });
});