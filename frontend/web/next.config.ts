import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ottimizzazioni per produzione
  compress: true,
  poweredByHeader: false,
  
  // Per Docker deployment
  output: 'standalone',
  
  // Configurazione immagini
  images: {
    domains: ['your-domain.com'], // Aggiungi i domini delle tue immagini
    formats: ['image/webp', 'image/avif'],
  },
  
  // Headers di sicurezza
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;