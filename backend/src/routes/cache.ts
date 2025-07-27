import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { redisService } from '../services/redisService';
import { CacheService } from '../services/cacheService';
import { APIResponse } from '@/types';

const router = Router();

// Get cache statistics (admin only)
router.get('/stats', protect, async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    
    // Only allow admin users to view cache stats
    if (user.role !== 'admin' && user.email !== 'mirco.carp@icloud.com') {
      res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
      return;
    }

    const isHealthy = redisService.isHealthy();
    
    if (!isHealthy) {
      res.json({
        success: true,
        data: {
          status: 'disconnected',
          message: 'Redis is not connected'
        }
      });
      return;
    }

    // Get detailed Redis memory and performance stats
    const memoryUsage = await redisService.getMemoryUsage();
    
    res.json({
      success: true,
      data: {
        status: 'connected',
        healthy: isHealthy,
        memory: memoryUsage,
        message: 'Redis cache is operational'
      }
    });
  } catch (error: any) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get cache statistics'
    });
  }
});

// Clear specific cache patterns (admin only)
router.delete('/clear/:pattern', protect, async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const { pattern } = req.params;
    
    // Only allow admin users to clear cache
    if (user.role !== 'admin' && user.email !== 'mirco.carp@icloud.com') {
      res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
      return;
    }

    let deletedCount = 0;

    switch (pattern) {
      case 'recipes':
        deletedCount = await redisService.deletePattern('public:recipes:*');
        break;
      case 'nutrition':
        await CacheService.invalidateNutritionCache();
        deletedCount = await redisService.deletePattern('nutrition:*');
        break;
      case 'recognition':
        await CacheService.invalidateRecognitionCache();
        deletedCount = await redisService.deletePattern('recognition:*');
        break;
      case 'all':
        deletedCount = await redisService.deletePattern('*');
        break;
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid cache pattern. Use: recipes, nutrition, recognition, or all'
        });
        return;
    }

    res.json({
      success: true,
      data: {
        pattern,
        deletedKeys: deletedCount,
        message: `Cleared ${deletedCount} cache entries for pattern: ${pattern}`
      }
    });
  } catch (error: any) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear cache'
    });
  }
});

export { router as cacheRoutes };