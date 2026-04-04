/** @type {import('next').NextConfig} */
const nextConfig = {
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
}

module.exports = nextConfig
