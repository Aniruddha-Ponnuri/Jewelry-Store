import { z } from 'zod'

// Centralized environment variable validation to ensure production readiness
const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .catch('https://jewelry-store-swart.vercel.app'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Optional secret used to protect the on-demand revalidation API
  REVALIDATE_SECRET: z.string().optional(),
  // Keep-alive configuration
  NEXT_PUBLIC_KEEP_ALIVE_ENABLED: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .default('true'),
  NEXT_PUBLIC_KEEP_ALIVE_INTERVAL: z
    .string()
    .optional()
    .transform((val) => parseInt(val || '7200000', 10)) // 2 hours default
    .default(7200000),
  NEXT_PUBLIC_KEEP_ALIVE_BACKGROUND_INTERVAL: z
    .string()
    .optional()
    .transform((val) => parseInt(val || '600000', 10)) // 10 minutes default
    .default(600000),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  // Fail fast on server during build or runtime if critical env is missing
  // Do not throw on the client to avoid breaking hydration
  if (typeof window === 'undefined') {
    console.error('[ENV] Invalid environment configuration:', parsed.error.flatten())
  }
}

export const env = (parsed.success
  ? parsed.data
  : {
      NEXT_PUBLIC_SITE_URL:
        process.env.NEXT_PUBLIC_SITE_URL || 'https://jewelry-store-swart.vercel.app',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
      NEXT_PUBLIC_KEEP_ALIVE_ENABLED: process.env.NEXT_PUBLIC_KEEP_ALIVE_ENABLED === 'true',
      NEXT_PUBLIC_KEEP_ALIVE_INTERVAL: parseInt(process.env.NEXT_PUBLIC_KEEP_ALIVE_INTERVAL || '7200000', 10),
      NEXT_PUBLIC_KEEP_ALIVE_BACKGROUND_INTERVAL: parseInt(process.env.NEXT_PUBLIC_KEEP_ALIVE_BACKGROUND_INTERVAL || '600000', 10),
    }) as z.infer<typeof schema>

