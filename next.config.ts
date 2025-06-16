/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com', 'images.unsplash.com'],
    unoptimized: true
  },
  experimental: {
    appDir: true
  }
}

module.exports = nextConfig
