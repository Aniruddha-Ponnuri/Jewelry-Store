import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { env } from '@/lib/env'
import { getPersistentStorage } from '@/lib/auth/persistentStorage'

// Singleton client instance
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Return existing instance if available
  if (clientInstance) {
    return clientInstance
  }

  // Validate environment variables
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials missing. Check environment variables.')
  }

  clientInstance = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        fetch: (url, options = {}) => {
          // Add timeout to all fetch requests (15s)
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 15000)

          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).finally(() => clearTimeout(timeout))
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: getPersistentStorage(),
        storageKey: 'sb-jfuhcgnjqfeznqpbloze-auth-token',
        debug: false, // Disable debug logging
      }
    }
  )

  return clientInstance
}
