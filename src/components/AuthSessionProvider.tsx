'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRobustAuth } from '@/hooks/useRobustAuth'

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const { refreshAdminStatus } = useRobustAuth({
    requireAuth: false,
    requireAdmin: false
  })
  
  useEffect(() => {
    const supabase = createClient()
    
    // Session refresh handler
    const handleSessionRefresh = async () => {
      try {
        console.log('AuthSessionProvider: Refreshing session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('AuthSessionProvider: Session refresh error:', error)
          return
        }
        
        if (session?.user) {
          console.log('AuthSessionProvider: Session refreshed, updating admin status')
          // Small delay to ensure auth context is updated
          setTimeout(() => {
            refreshAdminStatus()
          }, 100)
        }
      } catch (error) {
        console.error('AuthSessionProvider: Error refreshing session:', error)
      }
    }

    // Set up periodic session refresh
    const sessionRefreshInterval = setInterval(() => {
      handleSessionRefresh()
    }, 5 * 60 * 1000) // Refresh every 5 minutes

    // Also refresh on page focus
    const handleFocus = () => {
      handleSessionRefresh()
    }

    window.addEventListener('focus', handleFocus)

    // Cleanup
    return () => {
      clearInterval(sessionRefreshInterval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshAdminStatus])

  return <>{children}</>
}
