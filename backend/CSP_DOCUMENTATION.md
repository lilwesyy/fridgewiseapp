# Content Security Policy (CSP) Implementation

## Overview

Comprehensive Content Security Policy implementation for FridgeWise API to prevent XSS, code injection, and other web vulnerabilities.

## Features

### 🛡️ Security Directives

- **default-src**: Fallback for all other directives (`'self'`)
- **script-src**: JavaScript execution restrictions (nonce-based in production)
- **style-src**: CSS loading restrictions (allows inline for CSS-in-JS)
- **img-src**: Image loading restrictions (allows data URIs and HTTPS)
- **font-src**: Font loading restrictions
- **connect-src**: Network connection restrictions (APIs and WebSocket)
- **media-src**: Media loading restrictions
- **object-src**: Object/embed restrictions (`'none'`)
- **frame-src**: Frame/iframe restrictions (`'none'`)
- **frame-ancestors**: Clickjacking prevention (`'none'`)
- **form-action**: Form submission restrictions
- **base-uri**: Base tag injection prevention
- **worker-src**: Service worker restrictions
- **manifest-src**: PWA manifest restrictions

### 🔐 Additional Security Headers

- **X-Content-Type-Options**: MIME type sniffing prevention
- **X-XSS-Protection**: XSS filter activation
- **X-Frame-Options**: Clickjacking prevention
- **Referrer-Policy**: Referrer information control
- **Permissions-Policy**: Browser feature access control
- **Cross-Origin-***: Cross-origin request policies
- **Strict-Transport-Security**: HTTPS enforcement (production)
- **Expect-CT**: Certificate transparency (production)

## Configuration

### Environment Variables

```bash
# CSP Report URI (optional)
CSP_REPORT_URI=https://your-domain.com/api/security/csp-report

# Domain configuration for CSP
FRONTEND_DOMAIN=https://your-frontend.com
API_DOMAIN=https://api.your-domain.com

# Environment
NODE_ENV=production  # Affects CSP strictness
```

### Trusted Domains

#### Development
- `localhost:*`
- `127.0.0.1:*`
- `192.168.1.38:*`
- `*.ngrok.io`
- `*.ngrok-free.app`
- `*.expo.dev`
- `*.expo.io`

#### Production
- Configured via `FRONTEND_DOMAIN` and `API_DOMAIN`
- Google APIs (`generativelanguage.googleapis.com`, `*.googleapis.com`)
- OpenAI (`api.openai.com`)
- USDA API (`api.nal.usda.gov`)
- MealDB (`www.themealdb.com`)
- Cloudinary (`res.cloudinary.com`, `api.cloudinary.com`)

## Usage

### Basic Implementation

```typescript
import { cspMiddleware } from './middleware/contentSecurityPolicy';

app.use(cspMiddleware);
```

### Environment-Specific

```typescript
import { developmentCSP, productionCSP } from './middleware/contentSecurityPolicy';

if (process.env.NODE_ENV === 'production') {
  app.use(productionCSP());
} else {
  app.use(developmentCSP());
}
```

### Route-Specific CSP

```typescript
import { ContentSecurityPolicyMiddleware } from './middleware/contentSecurityPolicy';

// Custom CSP for specific route
const customCSP = ContentSecurityPolicyMiddleware.forRoute({
  reportOnly: false,
  nonce: true,
  strictDynamic: true
});

router.use('/api/secure-route', customCSP, handler);
```

### Nonce Usage (for inline scripts)

```typescript
import { getNonce } from './middleware/contentSecurityPolicy';

app.get('/page', (req, res) => {
  const nonce = getNonce(req);
  res.send(`
    <script nonce="${nonce}">
      console.log('This script is allowed');
    </script>
  `);
});
```

## Monitoring & Reporting

### CSP Violation Reports

CSP violations are automatically logged and can be sent to a monitoring service:

```bash
POST /api/security/csp-report
```

Violation reports include:
- Document URI where violation occurred
- Violated directive
- Blocked URI
- Source file and line number
- User agent and IP address

### Admin Endpoints

#### Security Headers Test
```bash
GET /api/security/headers-test
Authorization: Bearer <admin-token>
```

#### Policy Information
```bash
GET /api/security/policy-info
Authorization: Bearer <admin-token>
```

## Development vs Production

### Development Mode
- **Report-Only**: CSP violations logged but not blocked
- **Nonce**: Disabled for easier development
- **unsafe-eval**: Allowed for hot reloading
- **WebSocket**: Allowed for dev servers

### Production Mode
- **Enforcement**: CSP violations blocked
- **Nonce**: Enabled for script security
- **HSTS**: Enabled for HTTPS enforcement
- **Upgrade Insecure Requests**: HTTP to HTTPS upgrade
- **Strict Dynamic**: Enhanced script security

## Best Practices

### 1. Script Loading
```html
<!-- ✅ Good: Use nonce for inline scripts -->
<script nonce="{{nonce}}">
  console.log('Safe inline script');
</script>

<!-- ❌ Bad: Inline scripts without nonce -->
<script>
  console.log('This will be blocked');
</script>
```

### 2. Style Loading
```html
<!-- ✅ Good: External stylesheets -->
<link rel="stylesheet" href="/styles.css">

<!-- ✅ Good: Inline styles (allowed for CSS-in-JS) -->
<div style="color: red;">Styled content</div>
```

### 3. Image Loading
```html
<!-- ✅ Good: HTTPS images -->
<img src="https://res.cloudinary.com/image.jpg">

<!-- ✅ Good: Data URIs -->
<img src="data:image/png;base64,...">

<!-- ❌ Bad: HTTP images (blocked in production) -->
<img src="http://unsecure-site.com/image.jpg">
```

### 4. API Calls
```javascript
// ✅ Good: Trusted API domains
fetch('https://api.openai.com/v1/chat/completions')
fetch('https://generativelanguage.googleapis.com/v1beta/models')

// ❌ Bad: Untrusted domains
fetch('https://malicious-site.com/api')
```

## Troubleshooting

### Common Issues

1. **Scripts Blocked**
   - Use nonce for inline scripts
   - Load scripts from trusted domains
   - Check browser console for CSP violations

2. **Styles Not Loading**
   - External stylesheets should be from trusted domains
   - Inline styles are allowed by default

3. **API Calls Failing**
   - Ensure API domains are in trusted list
   - Check connect-src directive

4. **Images Not Loading**
   - Use HTTPS for external images
   - Data URIs are allowed
   - Check img-src directive

### Debugging

1. **Check CSP Headers**
```bash
curl -I https://your-api.com/health
```

2. **View Violation Reports**
```bash
tail -f logs/csp-violations.log
```

3. **Test Security Headers**
```bash
curl -H "Authorization: Bearer <admin-token>" \
     https://your-api.com/api/security/headers-test
```

## Security Benefits

- **XSS Prevention**: Blocks malicious script injection
- **Code Injection**: Prevents unauthorized code execution
- **Clickjacking**: Prevents iframe embedding attacks
- **Data Exfiltration**: Restricts unauthorized network requests
- **MIME Confusion**: Prevents MIME type sniffing attacks
- **Protocol Downgrade**: Forces HTTPS in production

## Compliance

This CSP implementation helps meet security requirements for:
- **OWASP Top 10**: Injection, XSS, Insecure Direct Object References
- **PCI DSS**: Secure web application requirements
- **GDPR**: Data protection through security measures
- **SOC 2**: Security controls and monitoring