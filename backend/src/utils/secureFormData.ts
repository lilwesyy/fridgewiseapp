const crypto = require('crypto');
const FormData = require('form-data');

/**
 * Factory function to create FormData with secure boundary
 * This addresses the insecure random function vulnerability in form-data
 */
export const createSecureFormData = (options?: any): any => {
  const formData = new FormData(options);
  
  // Generate a cryptographically secure boundary
  const randomBytes = crypto.randomBytes(16);
  const secureBoundary = `----formdata-fridgewise-${randomBytes.toString('hex')}`.substring(0, 70);
  
  // Override the internal boundary with our secure one
  (formData as any)._boundary = secureBoundary;
  
  return formData;
};

/**
 * Secure FormData class with cryptographically secure boundary generation
 */
export class SecureFormData {
  private formData: any;
  
  constructor(options?: any) {
    this.formData = createSecureFormData(options);
  }
  
  append(name: string, value: any, options?: any) {
    return this.formData.append(name, value, options);
  }
  
  getHeaders() {
    return this.formData.getHeaders();
  }
  
  getBoundary() {
    return this.formData.getBoundary();
  }
  
  getLength(callback: (err: Error | null, length: number) => void) {
    return this.formData.getLength(callback);
  }
  
  pipe(destination: any) {
    return this.formData.pipe(destination);
  }
  
  submit(params: any, callback?: any) {
    return this.formData.submit(params, callback);
  }
  
  toString() {
    return this.formData.toString();
  }
  
  getBuffer() {
    return this.formData.getBuffer();
  }
}

/**
 * Utility to generate secure multipart boundaries
 */
export const generateSecureBoundary = (): string => {
  const randomBytes = crypto.randomBytes(16);
  return `----formdata-fridgewise-${randomBytes.toString('hex')}`.substring(0, 70);
};

/**
 * Secure random string generator
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').substring(0, length);
};

// Export as default for drop-in replacement
export { SecureFormData as FormData };