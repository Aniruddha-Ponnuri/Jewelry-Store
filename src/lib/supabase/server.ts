import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { env } from '@/lib/env'

/** Creates a Supabase client for server-side usage */
export async function createClient() {
  // Validate environment variables at runtime
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const error = 'Supabase credentials missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    console.error(error)
    throw new Error(error)
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        fetch: (url, options = {}) => {
          // Add timeout to all server-side fetch requests (30s)
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 30000)
          
          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).finally(() => clearTimeout(timeout))
        },
      },
      cookies: {
        get: (name: string) => {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },        set: (name: string, value: string, options: CookieOptions) => {
          try {
            cookieStore.set({ 
              name, 
              value, 
              ...options,
              // Cookie settings - secure only in production
              httpOnly: options.httpOnly ?? true,
              secure: process.env.NODE_ENV === 'production', // FIXED: false in dev
              sameSite: options.sameSite ?? 'lax'
            })
          } catch (error) {
            // Log error in development for debugging
            if (process.env.NODE_ENV === 'development') {
              console.warn('Failed to set cookie:', name, error)
            }
          }
        },
        remove: (name: string, options: CookieOptions) => {
          try {
            cookieStore.set({ 
              name, 
              value: '', 
              ...options, 
              maxAge: 0,
              expires: new Date(0)
            })
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
      global: {
        fetch: (url, options = {}) => {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 10000)
          
          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).finally(() => clearTimeout(timeout))
        },
      },
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
