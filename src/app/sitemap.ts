import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://jewelry-store-swart.vercel.app'
  // Static routes; dynamic products can be added via database in future
  const routes = ['/', '/products', '/privacy', '/terms', '/shipping', '/returns'].map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1 : 0.7,
  }))

  return routes
}

