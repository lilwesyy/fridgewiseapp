import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

interface RateLimiterConfig {
  points: number; // Number of requests
  duration: number; // Per duration in seconds
  blockDuration?: number; // Block for duration in seconds (optional)
}

// Rate limiters for different endpoints
const recipeLimiters = {
  // Critical AI-powered endpoints
  generate: new RateLimiterMemory({
    keyPrefix: 'recipe_generate',
    points: 5, // 5 requests
    duration: 60, // per 60 seconds
    blockDuration: 60, // block for 60 seconds if exceeded
  }),
  
  chat: new RateLimiterMemory({
    keyPrefix: 'ai_chat', 
    points: 10, // 10 requests
    duration: 60, // per 60 seconds
    blockDuration: 30, // block for 30 seconds if exceeded
  }),
  
  imageAnalysis: new RateLimiterMemory({
    keyPrefix: 'image_analysis',
    points: 3, // 3 requests
    duration: 60, // per 60 seconds
    blockDuration: 120, // block for 2 minutes if exceeded
  }),
  
  // Medium priority endpoints
  createRecipe: new RateLimiterMemory({
    keyPrefix: 'recipe_create',
    points: 20, // 20 requests
    duration: 60, // per 60 seconds
    blockDuration: 30, // block for 30 seconds if exceeded
  }),
  
  ingredientSearch: new RateLimiterMemory({
    keyPrefix: 'ingredient_search',
    points: 30, // 30 requests
    duration: 60, // per 60 seconds
    blockDuration: 15, // block for 15 seconds if exceeded
  }),
};

export const rateLimitMiddleware = (type: keyof typeof recipeLimiters) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limiter = recipeLimiters[type];
      const userId = (req as any).user?.id || req.ip; // Use user ID if available, fallback to IP
      
      await limiter.consume(userId);
      next();
    } catch (rateLimiterRes: any) {
      const secs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(secs));
      
      // Get the rate limit info
      const limiter = recipeLimiters[type];
      const limitInfo = {
        limit: limiter.points,
        remaining: rateLimiterRes.remainingPoints || 0,
        reset: new Date(Date.now() + rateLimiterRes.msBeforeNext),
        retryAfter: secs
      };
      
      res.status(429).json({
        success: false,
        error: `Too many requests. You can make ${limiter.points} requests per minute. Try again in ${secs} seconds.`,
        rateLimitInfo: limitInfo
      });
    }
  };
};

// Export individual rate limiters for easy use
export const rateLimits = {
  recipeGeneration: rateLimitMiddleware('generate'),
  aiChat: rateLimitMiddleware('chat'), 
  imageAnalysis: rateLimitMiddleware('imageAnalysis'),
  recipeCreation: rateLimitMiddleware('createRecipe'),
  ingredientSearch: rateLimitMiddleware('ingredientSearch'),
};