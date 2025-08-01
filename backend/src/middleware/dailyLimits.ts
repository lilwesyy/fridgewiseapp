import { Request, Response, NextFunction } from 'express';
import { DailyUsage } from '../models/DailyUsage';

// Daily limits configuration
const DAILY_LIMITS = {
  recipeGenerations: 3,
  aiChatMessages: 10,  // Reduced limit for AI chat
  imageAnalyses: 10,   // Reasonable limit for image processing
};

interface DailyLimitRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

export const checkDailyLimit = (limitType: keyof typeof DAILY_LIMITS) => {
  return async (req: DailyLimitRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Skip limit check for admin users
      if (req.user.role === 'admin') {
        (req as any).dailyUsage = {
          current: 0,
          limit: Number.MAX_SAFE_INTEGER,
          remaining: Number.MAX_SAFE_INTEGER,
          limitType
        };
        return next();
      }

      const usage = await DailyUsage.getTodayUsage(req.user.id);
      const currentUsage = usage[limitType];
      const limit = DAILY_LIMITS[limitType];

      if (currentUsage >= limit) {
        const resetTime = new Date();
        resetTime.setHours(24, 0, 0, 0); // Next midnight
        
        return res.status(429).json({
          success: false,
          error: `Daily limit exceeded. You can generate ${limit} ${limitType.replace(/([A-Z])/g, ' $1').toLowerCase()} per day.`,
          dailyLimitInfo: {
            limit,
            used: currentUsage,
            remaining: 0,
            resetTime: resetTime.toISOString(),
            limitType
          }
        });
      }

      // Store usage info for potential increment after successful operation
      (req as any).dailyUsage = {
        current: currentUsage,
        limit,
        remaining: limit - currentUsage,
        limitType
      };

      next();
    } catch (error) {
      console.log('Daily limit check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check daily limits'
      });
    }
  };
};

// Middleware to increment usage after successful operation
export const incrementDailyUsage = (limitType: keyof typeof DAILY_LIMITS) => {
  return async (req: DailyLimitRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        return next();
      }

      // Increment the usage count
      switch (limitType) {
        case 'recipeGenerations':
          await DailyUsage.incrementRecipeGeneration(req.user.id);
          break;
        case 'aiChatMessages':
          await DailyUsage.incrementAiChat(req.user.id);
          break;
        case 'imageAnalyses':
          await DailyUsage.incrementImageAnalysis(req.user.id);
          break;
      }

      next();
    } catch (error) {
      console.log('Failed to increment daily usage:', error);
      // Don't fail the request if usage tracking fails
      next();
    }
  };
};

// Utility function to get user's current daily usage
export const getUserDailyUsage = async (userId: string, userRole?: string) => {
  try {
    const usage = await DailyUsage.getTodayUsage(userId);
    
    // For admin users, return infinite limits
    if (userRole === 'admin') {
      return {
        recipeGenerations: {
          used: usage.recipeGenerations,
          limit: Number.MAX_SAFE_INTEGER,
          remaining: Number.MAX_SAFE_INTEGER
        },
        aiChatMessages: {
          used: usage.aiChatMessages,
          limit: Number.MAX_SAFE_INTEGER,
          remaining: Number.MAX_SAFE_INTEGER
        },
        imageAnalyses: {
          used: usage.imageAnalyses,
          limit: Number.MAX_SAFE_INTEGER,
          remaining: Number.MAX_SAFE_INTEGER
        },
        date: usage.date
      };
    }
    
    return {
      recipeGenerations: {
        used: usage.recipeGenerations,
        limit: DAILY_LIMITS.recipeGenerations,
        remaining: Math.max(0, DAILY_LIMITS.recipeGenerations - usage.recipeGenerations)
      },
      aiChatMessages: {
        used: usage.aiChatMessages,
        limit: DAILY_LIMITS.aiChatMessages,
        remaining: Math.max(0, DAILY_LIMITS.aiChatMessages - usage.aiChatMessages)
      },
      imageAnalyses: {
        used: usage.imageAnalyses,
        limit: DAILY_LIMITS.imageAnalyses,
        remaining: Math.max(0, DAILY_LIMITS.imageAnalyses - usage.imageAnalyses)
      },
      date: usage.date
    };
  } catch (error) {
    console.log('Error getting daily usage:', error);
    throw error;
  }
};

export { DAILY_LIMITS };