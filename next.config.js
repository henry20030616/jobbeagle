const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 消除 Next.js 偵測到多個 lockfile 時的 workspace root 誤判警告
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/live',
        destination: '/shorts',
        permanent: true,
      },
      {
        source: '/api/live',
        destination: '/api/shorts',
        permanent: true,
      },
      {
        source: '/pre-flight',
        destination: '/confirm',
        permanent: false,
      },
    ];
  },
  async headers() {
    const baseSecurity = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'X-DNS-Prefetch-Control', value: 'off' },
    ];
    return [
      {
        source: '/:path*',
        headers: [
          ...baseSecurity,
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
        ],
      },
      {
        source: '/confirm',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' chrome-extension:;",
          },
        ],
      },
      {
        source: '/pre-flight',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' chrome-extension:;",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
