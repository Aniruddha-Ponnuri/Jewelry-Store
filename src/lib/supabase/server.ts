import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/** Creates a Supabase client for server-side usage */
export async function createClient() {
  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables are not set.')
  }
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,        set: (name: string, value: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // In read-only contexts, we can't set cookies, so we silently ignore
            // This is expected behavior for SSG pages
          }
        },
        remove: (name: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          } catch {
            // In read-only contexts, we can't remove cookies, so we silently ignore
            // This is expected behavior for SSG pages
          }
        },
      },
    }
  )
}

/** Creates a Supabase client for logout operations with enhanced cookie clearing */
export async function createLogoutClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,        set: (name: string, value: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // During logout, we want to continue even if setting fails
            console.warn(`Warning: Could not set cookie "${name}" during logout`)
          }
        },
        remove: (name: string, options: CookieOptions) => {
          try {
            // Force remove with multiple strategies
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
            cookieStore.delete(name)
          } catch {
            console.warn(`Warning: Could not remove cookie "${name}" during logout`)
          }
        },
      },
    }
  )
}

/** Creates a Supabase client for use without authentication */
export function createServiceClient() {
  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables are not set for service client.')
  }
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
  )
}
