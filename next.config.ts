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
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Disable source maps in development to avoid 404 errors from @supabase packages
  productionBrowserSourceMaps: false,
  webpack: (config, { dev, isServer }) => {
    // Disable source maps for Supabase packages to prevent 404s
    if (dev && !isServer) {
      config.module.rules.push({
        test: /node_modules\/@supabase/,
        use: ['source-map-loader'],
        enforce: 'pre',
      });
    }
    return config;
  },
};

export default nextConfig;
