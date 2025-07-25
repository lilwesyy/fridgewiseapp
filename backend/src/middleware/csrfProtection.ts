import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface CSRFRequest extends Request {
  csrfToken?: string;
}

// Simple CSRF protection for API routes
export const csrfProtection = (req: CSRFRequest, res: Response, next: NextFunction) => {
  // Skip CSRF for GET requests and safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for mobile app requests (identified by user agent or custom header)
  const userAgent = req.get('User-Agent') || '';
  const isExpoApp = userAgent.includes('Expo') || req.get('X-Expo-App') === 'true';
  
  if (isExpoApp) {
    return next();
  }

  // For web requests, check for CSRF token
  const token = req.get('X-CSRF-Token') || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing or invalid'
    });
  }

  next();
};

// Generate CSRF token endpoint
export const generateCSRFToken = (req: CSRFRequest, res: Response) => {
  const token = crypto.randomBytes(32).toString('hex');
  
  // Store in session if available
  if (req.session) {
    req.session.csrfToken = token;
  }

  res.json({
    success: true,
    csrfToken: token
  });
};