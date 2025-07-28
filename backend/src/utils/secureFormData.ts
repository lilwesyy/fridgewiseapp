const crypto = require('crypto');
const OriginalFormData = require('form-data');

/**
 * Create FormData with secure boundary
 * This addresses the insecure random function vulnerability in form-data
 */
export const createSecureFormData = (options?: any) => {
  const formData = new OriginalFormData(options);
  
  // Generate a cryptographically secure boundary
  const randomBytes = crypto.randomBytes(16);
  const secureBoundary = `----formdata-fridgewiseai-${randomBytes.toString('hex')}`.substring(0, 70);
  
  // Override the internal boundary with our secure one
  (formData as any)._boundary = secureBoundary;
  
  return formData;
};

/**
 * Secure FormData - extends original FormData with secure boundary
 */
export const SecureFormData = function(this: any, options?: any) {
  // Create a new FormData instance
  const formData = createSecureFormData(options);
  
  // Return the secure FormData instance directly
  return formData;
} as any;

/**
 * Utility to generate secure multipart boundaries
 */
export const generateSecureBoundary = (): string => {
  const randomBytes = crypto.randomBytes(16);
  return `----formdata-fridgewiseai-${randomBytes.toString('hex')}`.substring(0, 70);
};

/**
 * Secure random string generator
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').substring(0, length);
};

// Export for drop-in replacement - this returns the actual FormData instance
export { SecureFormData as FormData };