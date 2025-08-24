import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
                if (process.env.NODE_ENV !== 'production') console.warn('Error reading from localStorage:', error)
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
                if (process.env.NODE_ENV !== 'production') console.warn('Error writing to localStorage:', error)
              }
            }
          },
          removeItem: (key: string) => {
            if (typeof window !== 'undefined') {
              try {
                localStorage.removeItem(key)
              } catch (error) {
                if (process.env.NODE_ENV !== 'production') console.warn('Error removing from localStorage:', error)
              }
            }
          }
        }
      }
    }
  )
}
