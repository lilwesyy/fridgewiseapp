import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult, ValidationChain } from 'express-validator';

// Input sanitization utilities
export const sanitizeInput = {
  // Sanitize string input to prevent XSS and injection
  string: (value: any): string => {
    if (!value || typeof value !== 'string') return '';
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove on* event handlers
      .trim()
      .slice(0, 1000); // Limit length
  },

  // Sanitize integer input
  integer: (value: any, defaultValue: number = 0, min: number = Number.MIN_SAFE_INTEGER, max: number = Number.MAX_SAFE_INTEGER): number => {
    const parsed = parseInt(value as string);
    if (isNaN(parsed)) return defaultValue;
    return Math.max(min, Math.min(max, parsed));
  },

  // Sanitize float input
  float: (value: any, defaultValue: number = 0, min: number = Number.MIN_SAFE_INTEGER, max: number = Number.MAX_SAFE_INTEGER): number => {
    const parsed = parseFloat(value as string);
    if (isNaN(parsed)) return defaultValue;
    return Math.max(min, Math.min(max, parsed));
  },

  // Sanitize array input
  array: (value: any, maxItems: number = 100): any[] => {
    if (!Array.isArray(value)) {
      if (typeof value === 'string') {
        value = value.split(',');
      } else {
        return [];
      }
    }
    return value
      .slice(0, maxItems)
      .map((item: any) => {
        if (typeof item === 'string') {
          return sanitizeInput.string(item);
        } else if (typeof item === 'object' && item !== null) {
          return sanitizeInput.object(item);
        } else if (typeof item === 'number') {
          return item;
        } else if (typeof item === 'boolean') {
          return item;
        }
        return item;
      })
      .filter((item: any) => {
        if (typeof item === 'string') {
          return item.length > 0;
        }
        return item !== null && item !== undefined;
      });
  },

  // Sanitize object to prevent prototype pollution
  object: (obj: any): any => {
    if (!obj || typeof obj !== 'object') return {};
    
    const sanitized: any = {};
    for (const key in obj) {
      // Skip dangerous keys
      if (['__proto__', 'constructor', 'prototype'].includes(key)) {
        continue;
      }
      
      const value = obj[key];
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput.string(value);
      } else if (typeof value === 'number') {
        sanitized[key] = value;
      } else if (typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = sanitizeInput.array(value);
      } else if (typeof value === 'object' && value !== null) {
        // Allow recipe objects to pass through for AI chat
        if (key === 'recipe') {
          sanitized[key] = value;
        } else {
          // Recursively sanitize other objects
          sanitized[key] = sanitizeInput.object(value);
        }
      }
      // Skip functions for security
    }
    return sanitized;
  }
};

// Validation rules
export const validationRules = {
  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be a positive integer between 1 and 1000'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be a positive integer between 1 and 100')
  ],

  // Search validation
  search: [
    query('search')
      .optional()
      .isLength({ min: 1, max: 200 })
      .withMessage('Search term must be between 1 and 200 characters')
      .matches(/^[a-zA-Z0-9\s\-_.,!?àáèéìíòóùúç]+$/)
      .withMessage('Search term contains invalid characters')
  ],

  // Recipe filters validation
  recipeFilters: [
    query('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Difficulty must be easy, medium, or hard'),
    query('language')
      .optional()
      .isIn(['en', 'it'])
      .withMessage('Language must be en or it'),
    query('dietaryTags')
      .optional()
      .custom((value) => {
        if (typeof value === 'string') {
          const tags = value.split(',');
          const validTags = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'soy-free', 'egg-free'];
          return tags.every(tag => validTags.includes(tag.trim()));
        }
        return true;
      })
      .withMessage('Invalid dietary tags')
  ],

  // Recipe creation validation
  recipeCreation: [
    body('ingredients')
      .isArray({ min: 1, max: 50 })
      .withMessage('Ingredients must be an array with 1-50 items'),
    body('ingredients.*.name')
      .isLength({ min: 1, max: 100 })
      .withMessage('Ingredient name must be 1-100 characters'),
    body('language')
      .isIn(['en', 'it'])
      .withMessage('Language must be en or it'),
    body('dietaryRestrictions')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Too many dietary restrictions'),
    body('portions')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Portions must be between 1 and 20'),
    body('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Invalid difficulty level'),
    body('maxTime')
      .optional()
      .isInt({ min: 5, max: 480 })
      .withMessage('Max time must be between 5 and 480 minutes')
  ],

  // File upload validation
  fileUpload: [
    body('image')
      .optional()
      .custom((value) => {
        if (typeof value === 'string') {
          // Check if it's a valid base64 image
          const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
          if (!base64Pattern.test(value)) {
            throw new Error('Invalid image format');
          }
          // Check size (approximate)
          const sizeInBytes = (value.length * 3) / 4;
          if (sizeInBytes > 10 * 1024 * 1024) { // 10MB limit
            throw new Error('Image too large');
          }
        }
        return true;
      })
      .withMessage('Invalid image data')
  ],

  // ID parameter validation
  mongoId: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format')
  ],

  // Chat message validation
  chatMessage: [
    body('message')
      .isLength({ min: 1, max: 2000 })
      .withMessage('Message must be between 1 and 2000 characters')
      .matches(/^[a-zA-Z0-9\s\-_.,!?àáèéìíòóùúç'"()\[\]{}]+$/)
      .withMessage('Message contains invalid characters'),
    body('language')
      .optional()
      .isIn(['en', 'it'])
      .withMessage('Language must be en or it')
  ],

  // AI Chat validation (includes recipe context)
  aiChat: [
    body('message')
      .isLength({ min: 1, max: 2000 })
      .withMessage('Message must be between 1 and 2000 characters')
      .matches(/^[a-zA-Z0-9\s\-_.,!?àáèéìíòóùúç'"()\[\]{}]+$/)
      .withMessage('Message contains invalid characters'),
    body('recipe')
      .optional()
      .isObject()
      .withMessage('Recipe must be an object'),
    body('context')
      .optional()
      .isIn(['recipe_modification', 'general_cooking'])
      .withMessage('Invalid context')
  ]
};

// Validation result handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
    }));

    console.warn('🚨 Input validation failed:', formattedErrors);
    
    res.status(400).json({
      success: false,
      error: 'Invalid input data',
      details: formattedErrors
    });
    return;
  }
  
  next();
};

// Sanitization middleware
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Sanitize query parameters
    if (req.query) {
      for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeInput.string(req.query[key]);
        }
      }
    }

    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeInput.object(req.body);
    }

    // Sanitize params
    if (req.params) {
      for (const key in req.params) {
        req.params[key] = sanitizeInput.string(req.params[key]);
      }
    }

    next();
  } catch (error) {
    console.log('Error sanitizing request:', error);
    res.status(400).json({
      success: false,
      error: 'Invalid request data'
    });
    return;
  }
};

// Rate limiting by IP for sensitive operations
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const createRateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Clean expired entries
    for (const [key, data] of rateLimitStore.entries()) {
      if (now > data.resetTime) {
        rateLimitStore.delete(key);
      }
    }
    
    const entry = rateLimitStore.get(ip);
    
    if (!entry) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }
    
    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + windowMs;
      next();
      return;
    }
    
    if (entry.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
      return;
    }
    
    entry.count++;
    next();
  };
};

// Basic security headers middleware (CSP moved to dedicated middleware)
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Additional security headers are now handled by the CSP middleware
  // This middleware is kept for backwards compatibility and basic headers
  
  // Strict Transport Security (HSTS) for HTTPS enforcement
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Expect-CT for certificate transparency
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Expect-CT', 'max-age=86400, enforce');
  }
  
  next();
};