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
    ];
  },
  async headers() {
    return [
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
