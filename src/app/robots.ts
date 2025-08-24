import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://jewelry-store-swart.vercel.app'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/auth', '/login?*', '/register?*'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}

