export interface SecurityConfig {
  hostname: string;
  enforceHttps: boolean;
  allowedHosts: string[];
}

class ExpoSecurityService {
  private securityConfig: SecurityConfig[] = [];
  private isEnabled: boolean = true;
  private developmentMode: boolean = false;

  constructor() {
    this.setupSecurityConfig();
  }

  private setupSecurityConfig() {
    // Extract hostname from API URL
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:3000';
    const hostname = this.extractHostname(apiUrl);
    
    // Configure security based on environment
    if (hostname && apiUrl.startsWith('https://')) {
      // Production HTTPS mode - enable security checks
      this.securityConfig = [
        {
          hostname: hostname,
          enforceHttps: true,
          allowedHosts: [hostname, `www.${hostname}`]
        }
      ];
      this.developmentMode = false;
      console.log('🔒 Security service enabled for production HTTPS endpoints');
    } else {
      // Development/HTTP mode - relaxed security for local testing
      this.developmentMode = true;
      this.isEnabled = false;
      console.log('🔓 Security service in development mode for local endpoints');
    }
  }

  private extractHostname(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      console.error('Invalid API URL:', url);
      return null;
    }
  }

  /**
   * Make a secure fetch request with additional security validations
   */
  async secureFetch(url: string, options: RequestInit = {}, timeout: number = 60000): Promise<Response> {
    try {
      // Perform security validations
      await this.validateRequest(url, options);

      // Add security headers
      const secureOptions = this.addSecurityHeaders(options);

      // Make the request with timeout
      const response = await this.fetchWithTimeout(url, secureOptions, timeout);

      // Validate response
      await this.validateResponse(response, url);

      return response;

    } catch (error: any) {
      console.error('🚨 Secure fetch failed:', error);
      
      // For development mode, allow the request but log the issue
      if (this.developmentMode) {
        console.warn('⚠️ Security validation failed in development mode, proceeding with request');
        return fetch(url, options);
      }
      
      throw error;
    }
  }

  private async validateRequest(url: string, options: RequestInit): Promise<void> {
    if (!this.isEnabled) return;

    const hostname = this.extractHostname(url);
    const config = this.securityConfig.find(c => c.hostname === hostname);

    if (!config) {
      throw new Error(`Request to unauthorized hostname: ${hostname}`);
    }

    // Enforce HTTPS in production
    if (config.enforceHttps && !url.startsWith('https://')) {
      throw new Error('HTTPS required for secure communications');
    }

    // Validate allowed hosts
    if (!config.allowedHosts.includes(hostname)) {
      throw new Error(`Hostname not in allowed list: ${hostname}`);
    }
  }

  private addSecurityHeaders(options: RequestInit): RequestInit {
    const headers = {
      ...options.headers as Record<string, string>,
      // Add security headers
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache',
      // Add ngrok bypass header to skip warning page
      'ngrok-skip-browser-warning': 'true',
    };

    return {
      ...options,
      headers,
    };
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async validateResponse(response: Response, url: string): Promise<void> {
    if (!this.isEnabled) return;

    // Check for security-related response headers
    const securityHeaders = [
      'strict-transport-security',
      'x-content-type-options',
      'x-frame-options',
    ];

    if (url.startsWith('https://')) {
      const missingHeaders = securityHeaders.filter(header => !response.headers.get(header));
      if (missingHeaders.length > 0) {
        console.warn('⚠️ Missing security headers:', missingHeaders);
      }
    }

    // Validate content type for JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json') && !contentType.includes('text/')) {
      console.warn('⚠️ Unexpected content type:', contentType);
    }
  }

  /**
   * Update security configuration
   */
  updateSecurityConfig(config: SecurityConfig[]) {
    this.securityConfig = config;
    console.log('🔒 Security configuration updated');
  }

  /**
   * Enable/disable security service
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    console.log(`🔒 Security service ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get current security status
   */
  isEnabledStatus(): boolean {
    return this.isEnabled;
  }

  /**
   * Get current security configuration
   */
  getConfig(): SecurityConfig[] {
    return this.securityConfig;
  }

  /**
   * Check if in development mode
   */
  isDevelopmentMode(): boolean {
    return this.developmentMode;
  }

  /**
   * Test security configuration
   */
  async testSecurityConfig(hostname: string): Promise<boolean> {
    try {
      const testUrl = `https://${hostname}/api/health`;
      const response = await this.secureFetch(testUrl, { method: 'HEAD' });
      
      console.log('✅ Security configuration test passed for:', hostname);
      return response.ok;
    } catch (error) {
      console.error('❌ Security configuration test failed:', error);
      return false;
    }
  }

  /**
   * Get security recommendations
   */
  getSecurityRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.developmentMode) {
      recommendations.push('Enable HTTPS for production deployment');
      recommendations.push('Configure proper SSL certificates');
      recommendations.push('Set up security headers on server');
    }

    if (!this.isEnabled) {
      recommendations.push('Enable security service for production');
    }

    return recommendations;
  }
}

export const expoSecurityService = new ExpoSecurityService();
export default expoSecurityService;