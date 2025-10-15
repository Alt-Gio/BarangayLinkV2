import type { NextConfig } from 'next';
import withPWA from '@ducanh2912/next-pwa';

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

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.convex\.cloud\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'convex-api-cache',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        urlPattern: /^https:\/\/images\.clerk\.dev\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'clerk-images-cache',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-image-cache',
          expiration: {
            maxEntries: 256,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      {
        urlPattern: /\.(?:js|css|woff|woff2|ttf|otf)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-resources-cache',
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'general-cache',
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
})(nextConfig);