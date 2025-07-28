# Expo Security Service Setup Guide

## Overview
A comprehensive security service has been implemented for Expo managed workflow to enhance API communications security and prevent common security threats.

## Configuration Required

### 1. Security Configuration

The security service automatically configures based on your API URL environment variable:

```typescript
// In src/services/certificatePinning.ts
this.securityConfig = [
  {
    hostname: hostname,
    enforceHttps: true,
    allowedHosts: [hostname, `www.${hostname}`]
  }
];
```

### 2. Environment-Based Security

- **Development Mode**: HTTP endpoints, relaxed security
- **Production Mode**: HTTPS enforcement, security validations
- **Automatic Detection**: Based on EXPO_PUBLIC_API_URL

### 3. Security Features

The service provides:
- **HTTPS Enforcement**: Requires HTTPS in production
- **Host Validation**: Allows only configured hostnames
- **Timeout Protection**: 30-second request timeouts
- **Security Headers**: Adds protective request headers
- **Response Validation**: Validates response security headers

## Expo Compatibility

### 1. Managed Workflow Support

This security service is fully compatible with Expo managed workflow:
- No native modules required
- No additional build configuration
- Works with Expo Go for development
- Compatible with EAS Build for production

### 2. Development vs Production

```typescript
// Development mode detection
if (apiUrl.startsWith('https://')) {
  // Production security enabled
  this.developmentMode = false;
} else {
  // Development mode with relaxed security
  this.developmentMode = true;
}
```

## Security Considerations

### HTTPS Enforcement
- Production endpoints must use HTTPS
- Development allows HTTP for local testing
- Security headers validation for HTTPS responses

### Error Handling
Security failures will:
- Throw descriptive errors for security violations
- Log security warnings and recommendations
- Allow requests in development mode with warnings

### Development vs Production
- **Development**: Relaxed security, HTTP allowed, warnings logged
- **Production**: Strict HTTPS enforcement, host validation
- **Staging**: Same security as production with staging hostnames

## Testing

### Test Security Configuration
```typescript
// Test security service
await expoSecurityService.testSecurityConfig('yourdomain.com');

// Get security recommendations
const recommendations = expoSecurityService.getSecurityRecommendations();
console.log('Security recommendations:', recommendations);
```

### Validation Commands
```bash
# Test your server's security headers
curl -I https://yourdomain.com/api/health

# Check HTTPS configuration
curl -v https://yourdomain.com/api/health
```

## Troubleshooting

### Common Issues
1. **HTTPS errors**: Ensure production server has valid SSL certificate
2. **Development issues**: Service automatically relaxes security for HTTP
3. **Host validation**: Add additional hosts to allowedHosts array

### Debug Mode
To temporarily disable security service:

```typescript
// In certificatePinning.ts constructor
this.setEnabled(false); // Disable for debugging
this.developmentMode = true; // Force development mode
```

### Security Status Check
```typescript
// Check current security status
console.log('Security enabled:', expoSecurityService.isEnabledStatus());
console.log('Development mode:', expoSecurityService.isDevelopmentMode());
console.log('Config:', expoSecurityService.getConfig());
```