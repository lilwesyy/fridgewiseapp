import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';

const router = Router();

/**
 * CSP Violation Report endpoint
 * Receives and logs Content Security Policy violations
 */
router.post('/csp-report', (req: Request, res: Response) => {
  try {
    const report = req.body;
    
    // Log CSP violation with details
    console.warn('🚨 CSP Violation Report:', {
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      violation: {
        documentUri: report['document-uri'],
        violatedDirective: report['violated-directive'],
        blockedUri: report['blocked-uri'],
        effectiveDirective: report['effective-directive'],
        originalPolicy: report['original-policy'],
        sourceFile: report['source-file'],
        lineNumber: report['line-number'],
        columnNumber: report['column-number'],
        statusCode: report['status-code']
      }
    });

    // In production, you might want to send this to a monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // await sendToMonitoringService(report);
    }

    // Always respond with 204 No Content for CSP reports
    res.status(204).end();
  } catch (error) {
    console.error('Error processing CSP report:', error);
    res.status(204).end(); // Still respond with 204 even on error
  }
});

/**
 * Security headers test endpoint (admin only)
 * Allows testing of security headers implementation
 */
router.get('/headers-test', protect, (req: Request, res: Response): void => {
  const user = (req as any).user;
  
  if (user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }

  // Return information about security headers
  const securityInfo = {
    csp: res.getHeaders()['content-security-policy'] || res.getHeaders()['content-security-policy-report-only'],
    frameOptions: res.getHeaders()['x-frame-options'],
    contentTypeOptions: res.getHeaders()['x-content-type-options'],
    xssProtection: res.getHeaders()['x-xss-protection'],
    referrerPolicy: res.getHeaders()['referrer-policy'],
    permissionsPolicy: res.getHeaders()['permissions-policy'],
    hsts: res.getHeaders()['strict-transport-security'],
    expectCt: res.getHeaders()['expect-ct'],
    crossOriginOpenerPolicy: res.getHeaders()['cross-origin-opener-policy'],
    crossOriginEmbedderPolicy: res.getHeaders()['cross-origin-embedder-policy'],
    crossOriginResourcePolicy: res.getHeaders()['cross-origin-resource-policy']
  };

  res.json({
    success: true,
    data: {
      securityHeaders: securityInfo,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * Security policy info endpoint (admin only)
 * Provides information about current security policies
 */
router.get('/policy-info', protect, (req: Request, res: Response): void => {
  const user = (req as any).user;
  
  if (user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }

  res.json({
    success: true,
    data: {
      csp: {
        enabled: true,
        reportOnly: process.env.NODE_ENV === 'development',
        reportUri: process.env.CSP_REPORT_URI || null,
        nonceEnabled: true
      },
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['*'],
        credentials: true
      },
      rateLimit: {
        enabled: true,
        defaultWindow: '15 minutes',
        defaultMax: 100
      },
      https: {
        hstsEnabled: process.env.NODE_ENV === 'production',
        upgradeInsecureRequests: process.env.NODE_ENV === 'production'
      }
    }
  });
});

export { router as securityRoutes };