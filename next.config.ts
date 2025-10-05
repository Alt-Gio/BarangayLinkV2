import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
      {
        protocol: 'https',
        hostname: '**.convex.cloud',
      },
    ],
  },
  // Allow build to succeed with ESLint warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow build to succeed with TypeScript errors (use cautiously)
  typescript: {
    ignoreBuildErrors: true,
  },
  // PWA configuration
  reactStrictMode: true,
};

export default nextConfig;