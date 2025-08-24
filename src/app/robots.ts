import type { MetadataRoute } from 'next'

// Block all web crawling
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',
      },
    ],
    // No sitemap provided when crawling is disallowed
  }
}

