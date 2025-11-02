import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { env } from '@/lib/env'

export function createClient() {
  // Validate environment variables
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials missing. Check environment variables.')
  }

  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        // Enhanced session persistence settings
        storage: {
          getItem: (key: string) => {
            if (typeof window !== 'undefined') {
              try {
                return localStorage.getItem(key)
              } catch (error) {
                console.warn('Error reading from localStorage:', error)
                return null
              }
            }
            return null
          },
          setItem: (key: string, value: string) => {
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(key, value)
              } catch (error) {
                console.warn('Error writing to localStorage:', error)
              }
            }
          },
          removeItem: (key: string) => {
            if (typeof window !== 'undefined') {
              try {
                localStorage.removeItem(key)
              } catch (error) {
                console.warn('Error removing from localStorage:', error)
              }
            }
          }
        }
      }
    }
  )
}
