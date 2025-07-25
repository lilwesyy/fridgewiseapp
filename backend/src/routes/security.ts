import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';

// In-memory storage for CSP violations (in production, use Redis or database)
interface CSPViolation {
  id: string;
  timestamp: string;
  documentUri: string;
  violatedDirective: string;
  blockedUri: string;
  effectiveDirective: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
  userAgent: string;
  ip: string;
}

// Simple in-memory store (replace with Redis/DB in production)
const cspViolations: CSPViolation[] = [];
const MAX_VIOLATIONS_STORED = 1000;

const router = Router();

/**
 * CSP Report endpoint info (GET for testing)
 */
router.get('/csp-report', (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'CSP Report endpoint is active',
    method: 'POST',
    usage: 'This endpoint receives CSP violation reports via POST requests',
    timestamp: new Date().toISOString()
  });
});

/**
 * CSP Violation Report endpoint
 * Receives and logs Content Security Policy violations
 */
router.post('/csp-report', (req: Request, res: Response) => {
  try {
    const report = req.body;
    const timestamp = new Date().toISOString();
    
    // Create violation record
    const violation: CSPViolation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      documentUri: report['document-uri'] || '',
      violatedDirective: report['violated-directive'] || '',
      blockedUri: report['blocked-uri'] || '',
      effectiveDirective: report['effective-directive'] || '',
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number'],
      userAgent: req.get('User-Agent') || '',
      ip: req.ip || ''
    };

    // Store violation (keep only last MAX_VIOLATIONS_STORED)
    cspViolations.unshift(violation);
    if (cspViolations.length > MAX_VIOLATIONS_STORED) {
      cspViolations.splice(MAX_VIOLATIONS_STORED);
    }
    
    // Log CSP violation with details
    console.warn('🚨 CSP Violation Report:', {
      timestamp,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      violation: {
        documentUri: violation.documentUri,
        violatedDirective: violation.violatedDirective,
        blockedUri: violation.blockedUri,
        effectiveDirective: violation.effectiveDirective,
        sourceFile: violation.sourceFile,
        lineNumber: violation.lineNumber,
        columnNumber: violation.columnNumber
      }
    });

    // In production, you might want to send this to a monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // await sendToMonitoringService(violation);
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
 * CSP Statistics endpoint (admin only)
 * Provides detailed CSP violation statistics
 */
router.get('/csp-stats', protect, (req: Request, res: Response): void => {
  const user = (req as any).user;
  
  if (user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Filter violations by time periods
  const todayViolations = cspViolations.filter(v => new Date(v.timestamp) >= today);
  const yesterdayViolations = cspViolations.filter(v => {
    const vDate = new Date(v.timestamp);
    return vDate >= yesterday && vDate < today;
  });
  const weekViolations = cspViolations.filter(v => new Date(v.timestamp) >= weekAgo);

  // Group violations by directive
  const violationsByDirective = cspViolations.reduce((acc, violation) => {
    const directive = violation.violatedDirective;
    if (!acc[directive]) {
      acc[directive] = [];
    }
    acc[directive].push(violation);
    return acc;
  }, {} as Record<string, CSPViolation[]>);

  // Get top violations
  const topViolations = Object.entries(violationsByDirective)
    .map(([directive, violations]) => ({
      directive,
      count: violations.length,
      lastSeen: violations[0]?.timestamp || '',
      blockedUris: [...new Set(violations.map(v => v.blockedUri))].slice(0, 5)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Get recent violations
  const recentViolations = cspViolations
    .slice(0, 20)
    .map(v => ({
      id: v.id,
      timestamp: v.timestamp,
      directive: v.violatedDirective,
      blockedUri: v.blockedUri,
      documentUri: v.documentUri,
      sourceFile: v.sourceFile,
      lineNumber: v.lineNumber
    }));

  res.json({
    success: true,
    data: {
      summary: {
        totalViolations: cspViolations.length,
        violationsToday: todayViolations.length,
        violationsYesterday: yesterdayViolations.length,
        violationsThisWeek: weekViolations.length,
        uniqueDirectives: Object.keys(violationsByDirective).length,
        enabled: true,
        reportOnly: process.env.NODE_ENV === 'development'
      },
      topViolations,
      recentViolations,
      violationsByDirective: Object.keys(violationsByDirective).map(directive => ({
        directive,
        count: violationsByDirective[directive].length,
        percentage: ((violationsByDirective[directive].length / cspViolations.length) * 100).toFixed(1)
      }))
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
        reportUri: process.env.CSP_REPORT_URI || '/api/security/csp-report',
        nonceEnabled: true,
        violationsStored: cspViolations.length
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