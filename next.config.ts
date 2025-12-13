import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Output standalone for optimized Vercel deployment
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
      ],
    },
  ],
  // Enable experimental features for better performance
  experimental: {
    // Temporarily disable package optimization due to barrel export issues
    // optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Turbopack configuration (stable in Next.js 15.3+)
  // Note: Empty turbopack config means use defaults with built-in TypeScript support
  turbopack: {},
  // Disable source maps in development to avoid 404 errors from @supabase packages
  productionBrowserSourceMaps: false,
};

export default nextConfig;
