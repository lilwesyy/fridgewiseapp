#!/usr/bin/env node

/**
 * Script per testare l'endpoint CSP violations
 * Simula alcune violazioni CSP per testare la dashboard admin
 */

const fetch = require('node-fetch');

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Simula violazioni CSP di esempio
const sampleViolations = [
  {
    'document-uri': 'https://fridgewiseai.app/dashboard',
    'violated-directive': 'script-src',
    'blocked-uri': 'https://malicious-site.com/script.js',
    'effective-directive': 'script-src',
    'original-policy': "default-src 'self'; script-src 'self' 'nonce-abc123'",
    'source-file': 'https://fridgewiseai.app/dashboard',
    'line-number': 42,
    'column-number': 15,
    'status-code': 200
  },
  {
    'document-uri': 'https://fridgewiseai.app/recipes',
    'violated-directive': 'img-src',
    'blocked-uri': 'http://unsecure-images.com/recipe.jpg',
    'effective-directive': 'img-src',
    'original-policy': "default-src 'self'; img-src 'self' https: data:",
    'source-file': 'https://fridgewiseai.app/recipes',
    'line-number': 128,
    'column-number': 8,
    'status-code': 200
  },
  {
    'document-uri': 'https://fridgewiseai.app/profile',
    'violated-directive': 'style-src',
    'blocked-uri': 'inline',
    'effective-directive': 'style-src',
    'original-policy': "default-src 'self'; style-src 'self' 'unsafe-inline'",
    'source-file': 'https://fridgewiseai.app/profile',
    'line-number': 67,
    'column-number': 22,
    'status-code': 200
  },
  {
    'document-uri': 'https://fridgewiseai.app/camera',
    'violated-directive': 'connect-src',
    'blocked-uri': 'https://suspicious-api.com/upload',
    'effective-directive': 'connect-src',
    'original-policy': "default-src 'self'; connect-src 'self' https://api.openai.com",
    'source-file': 'https://fridgewiseai.app/camera',
    'line-number': 95,
    'column-number': 12,
    'status-code': 200
  },
  {
    'document-uri': 'https://fridgewiseai.app/dashboard',
    'violated-directive': 'script-src',
    'blocked-uri': 'eval',
    'effective-directive': 'script-src',
    'original-policy': "default-src 'self'; script-src 'self' 'nonce-abc123'",
    'source-file': 'https://fridgewiseai.app/dashboard',
    'line-number': 156,
    'column-number': 5,
    'status-code': 200
  }
];

async function sendViolation(violation) {
  try {
    const response = await fetch(`${API_URL}/api/security/csp-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      body: JSON.stringify(violation)
    });

    if (response.status === 204) {
      console.log(`✅ Violation sent: ${violation['violated-directive']} - ${violation['blocked-uri']}`);
    } else {
      console.log(`❌ Failed to send violation: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error sending violation:`, error.message);
  }
}

async function testCSPEndpoint() {
  console.log('🧪 Testing CSP Violations Endpoint\n');
  
  // Test GET endpoint first
  try {
    const response = await fetch(`${API_URL}/api/security/csp-report`);
    const data = await response.json();
    console.log('📋 CSP Report endpoint info:', data);
  } catch (error) {
    console.log('❌ Failed to get CSP endpoint info:', error.message);
    return;
  }

  console.log('\n📤 Sending sample violations...\n');

  // Send violations with delays to simulate real-world timing
  for (let i = 0; i < sampleViolations.length; i++) {
    await sendViolation(sampleViolations[i]);
    
    // Add some delay between violations
    if (i < sampleViolations.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n✅ All violations sent! You can now check the admin dashboard.');
  console.log('🔗 Admin dashboard should show the CSP violations in the security section.');
}

// Run the test
testCSPEndpoint().catch(console.log);