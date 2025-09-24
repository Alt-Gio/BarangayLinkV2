const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

module.exports = withPWA({
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['images.clerk.dev', 'your-convex-domain.convex.cloud'],
  },
});