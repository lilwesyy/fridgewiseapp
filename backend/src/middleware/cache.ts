import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redisService';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

export const cache = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // Default 5 minutes
    keyGenerator = (req: Request) => `cache:${req.method}:${req.originalUrl}`,
    condition = () => true
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching if condition is not met or Redis is not available
    if (!condition(req) || !redisService.isHealthy()) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      // Try to get cached response
      const cachedResponse = await redisService.get(cacheKey);
      
      if (cachedResponse) {
        const parsed = JSON.parse(cachedResponse);
        res.set(parsed.headers);
        res.status(parsed.status).json(parsed.data);
        return;
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache the response
      res.json = function(data: any) {
        // Cache the response
        const responseToCache = {
          status: res.statusCode,
          headers: res.getHeaders(),
          data: data
        };

        redisService.set(cacheKey, JSON.stringify(responseToCache), ttl)
          .catch(err => console.error('Cache set error:', err));

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Utility function to invalidate cache by pattern
export const invalidateCache = async (pattern: string): Promise<number> => {
  try {
    return await redisService.deletePattern(pattern);
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
};

// Cache key generators for common patterns
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  recipe: (recipeId: string) => `recipe:${recipeId}`,
  userRecipes: (userId: string) => `user:${userId}:recipes`,
  publicRecipes: (page: number = 1, limit: number = 10) => `public:recipes:${page}:${limit}`,
  ingredients: (userId: string) => `user:${userId}:ingredients`,
  nutritionAnalysis: (ingredients: string) => `nutrition:${Buffer.from(ingredients).toString('base64')}`,
  dishRecognition: (imageHash: string) => `recognition:${imageHash}`
};