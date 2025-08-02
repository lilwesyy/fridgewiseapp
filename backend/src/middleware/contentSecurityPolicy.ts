import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface CSPConfig {
  reportOnly?: boolean;
  reportUri?: string;
  nonce?: boolean;
  strictDynamic?: boolean;
}

interface CSPRequest extends Request {
  nonce?: string;
}

/**
 * Comprehensive Content Security Policy middleware
 * Protects against XSS, code injection, and other web vulnerabilities
 */
export class ContentSecurityPolicyMiddleware {
  private config: CSPConfig;
  private trustedDomains: string[];
  private apiDomains: string[];
  private cdnDomains: string[];

  constructor(config: CSPConfig = {}) {
    this.config = {
      reportOnly: process.env.NODE_ENV === 'development',
      nonce: true,
      strictDynamic: false,
      ...config
    };

    // Define trusted domains based on environment
    this.trustedDomains = this.getTrustedDomains();
    this.apiDomains = this.getApiDomains();
    this.cdnDomains = this.getCdnDomains();
  }

  /**
   * Get trusted domains based on environment
   */
  private getTrustedDomains(): string[] {
    const domains = ['localhost:*', '127.0.0.1:*'];
    
    if (process.env.NODE_ENV === 'production') {
      // Add production domains
      if (process.env.FRONTEND_DOMAIN) {
        domains.push(process.env.FRONTEND_DOMAIN);
      }
      if (process.env.API_DOMAIN) {
        domains.push(process.env.API_DOMAIN);
      }
    } else {
      // Development domains
      domains.push(
        'localhost:3001',
        'localhost:19006',
        '192.168.1.38:*',
        '*.ngrok.io',
        '*.ngrok-free.app',
        '*.expo.dev',
        '*.expo.io'
      );
    }

    return domains;
  }

  /**
   * Get API domains for connect-src
   */
  private getApiDomains(): string[] {
    const domains = [
      // Google services
      'generativelanguage.googleapis.com',
      'ai.google.dev',
      '*.googleapis.com',
      
      // OpenAI
      'api.openai.com',
      
      // USDA API
      'api.nal.usda.gov',
      
      // MealDB API
      'www.themealdb.com',
      
      // Cloudinary
      'res.cloudinary.com',
      'api.cloudinary.com',
    ];

    // Add Vision APIs if configured
    if (process.env.VISION_API_URL) {
      domains.push(process.env.VISION_API_URL.replace(/^https?:\/\//, ''));
    }
    if (process.env.RECOGNIZE_API_URL) {
      domains.push(process.env.RECOGNIZE_API_URL.replace(/^https?:\/\//, ''));
    }

    return domains;
  }

  /**
   * Get CDN domains for various resources
   */
  private getCdnDomains(): string[] {
    return [
      // Cloudinary CDN
      'res.cloudinary.com',
      
      // Common CDNs
      'cdn.jsdelivr.net',
      'unpkg.com',
      'cdnjs.cloudflare.com',
      
      // Font CDNs
      'fonts.googleapis.com',
      'fonts.gstatic.com',
    ];
  }

  /**
   * Generate cryptographically secure nonce
   */
  private generateNonce(): string {
    return crypto.randomBytes(16).toString('base64');
  }

  /**
   * Build CSP directive
   */
  private buildCSP(nonce?: string): string {
    const directives: string[] = [];

    // Default source - fallback for all other directives
    directives.push(`default-src 'self'`);

    // Script sources - very restrictive for security
    const scriptSrc = [`'self'`];
    if (nonce) {
      scriptSrc.push(`'nonce-${nonce}'`);
    }
    if (this.config.strictDynamic) {
      scriptSrc.push(`'strict-dynamic'`);
    }
    // Allow unsafe-eval only in development for hot reloading
    if (process.env.NODE_ENV === 'development') {
      scriptSrc.push(`'unsafe-eval'`);
    }
    directives.push(`script-src ${scriptSrc.join(' ')}`);

    // Style sources - allow inline styles for CSS-in-JS frameworks
    const styleSrc = [`'self'`, `'unsafe-inline'`];
    if (nonce) {
      styleSrc.push(`'nonce-${nonce}'`);
    }
    // Add CDN domains for styles
    styleSrc.push(...this.cdnDomains.map(domain => `https://${domain}`));
    directives.push(`style-src ${styleSrc.join(' ')}`);

    // Image sources - allow data URIs and HTTPS images
    const imgSrc = [
      `'self'`,
      `data:`,
      `blob:`,
      `https:`,
      ...this.cdnDomains.map(domain => `https://${domain}`)
    ];
    directives.push(`img-src ${imgSrc.join(' ')}`);

    // Font sources
    const fontSrc = [
      `'self'`,
      `data:`,
      ...this.cdnDomains.map(domain => `https://${domain}`)
    ];
    directives.push(`font-src ${fontSrc.join(' ')}`);

    // Connection sources - APIs and WebSocket connections
    const connectSrc = [
      `'self'`,
      ...this.trustedDomains.map(domain => domain.includes('://') ? domain : `https://${domain}`),
      ...this.apiDomains.map(domain => `https://${domain}`)
    ];
    
    // Add WebSocket support for development
    if (process.env.NODE_ENV === 'development') {
      connectSrc.push(`ws:`, `wss:`);
    }
    
    directives.push(`connect-src ${connectSrc.join(' ')}`);

    // Media sources
    directives.push(`media-src 'self' data: blob: https:`);

    // Object sources - very restrictive
    directives.push(`object-src 'none'`);

    // Frame sources - restrict embedding
    directives.push(`frame-src 'none'`);

    // Frame ancestors - prevent clickjacking
    directives.push(`frame-ancestors 'none'`);

    // Form action - restrict form submissions
    const formAction = [
      `'self'`,
      ...this.trustedDomains.map(domain => domain.includes('://') ? domain : `https://${domain}`)
    ];
    directives.push(`form-action ${formAction.join(' ')}`);

    // Base URI - prevent base tag injection
    directives.push(`base-uri 'self'`);

    // Manifest source - for PWA manifests
    directives.push(`manifest-src 'self'`);

    // Worker sources - for service workers
    directives.push(`worker-src 'self'`);

    // Child sources - for frames and workers
    directives.push(`child-src 'none'`);

    // Upgrade insecure requests in production
    if (process.env.NODE_ENV === 'production') {
      directives.push(`upgrade-insecure-requests`);
    }

    // Report URI if configured
    if (this.config.reportUri) {
      directives.push(`report-uri ${this.config.reportUri}`);
    }

    return directives.join('; ');
  }

  /**
   * Main middleware function
   */
  public middleware = (req: CSPRequest, res: Response, next: NextFunction): void => {
    try {
      let nonce: string | undefined;

      // Generate nonce if enabled
      if (this.config.nonce) {
        nonce = this.generateNonce();
        req.nonce = nonce;
      }

      // Build CSP header
      const cspValue = this.buildCSP(nonce);
      const headerName = this.config.reportOnly ? 
        'Content-Security-Policy-Report-Only' : 
        'Content-Security-Policy';

      // Set CSP header
      res.setHeader(headerName, cspValue);

      // Additional security headers
      this.setAdditionalSecurityHeaders(res);

      next();
    } catch (error) {
      console.log('CSP middleware error:', error);
      next();
    }
  };

  /**
   * Set additional security headers
   */
  private setAdditionalSecurityHeaders(res: Response): void {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy (replaces Feature Policy)
    const permissionsPolicy = [
      'camera=(self)',
      'microphone=(self)',
      'geolocation=(self)',
      'payment=(*)',
      'usb=()',
      'bluetooth=()',
      'magnetometer=()',
      'gyroscope=()',
      'speaker=(self)',
      'sync-xhr=()'
    ].join(', ');
    res.setHeader('Permissions-Policy', permissionsPolicy);

    // Cross-Origin policies
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }

  /**
   * Create CSP middleware for specific routes
   */
  public static forRoute(routeConfig: Partial<CSPConfig> = {}) {
    const csp = new ContentSecurityPolicyMiddleware(routeConfig);
    return csp.middleware;
  }

  /**
   * Create development-friendly CSP
   */
  public static development() {
    return new ContentSecurityPolicyMiddleware({
      reportOnly: true,
      nonce: false,
      strictDynamic: false
    }).middleware;
  }

  /**
   * Create production CSP
   */
  public static production() {
    return new ContentSecurityPolicyMiddleware({
      reportOnly: false,
      nonce: true,
      strictDynamic: true,
      reportUri: process.env.CSP_REPORT_URI
    }).middleware;
  }
}

// Export default middleware instance
export const cspMiddleware = ContentSecurityPolicyMiddleware.forRoute();

// Export specialized middleware functions
export const developmentCSP = ContentSecurityPolicyMiddleware.development;
export const productionCSP = ContentSecurityPolicyMiddleware.production;

// Export nonce utility for templates
export const getNonce = (req: CSPRequest): string | undefined => req.nonce;