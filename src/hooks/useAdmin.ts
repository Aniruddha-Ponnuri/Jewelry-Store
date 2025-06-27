import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export function useAdmin() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastCheck, setLastCheck] = useState<number>(0)

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      // Only check admin status if we haven't checked in the last 30 seconds
      // This prevents losing admin privileges during form submissions
      const now = Date.now()
      if (now - lastCheck < 30000 && lastCheck > 0) {
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()

        // Check if user is admin using the simple is_admin function
        const { data: adminCheck, error } = await supabase.rpc('is_admin')
        
        if (error) {
          console.error('Error checking admin status:', error)
          // Don't reset admin state on temporary errors to prevent privilege loss during form submissions
          if (error.message?.includes('JWT') || 
              error.message?.includes('session') ||
              error.message?.includes('fetch') ||
              error.message?.includes('network')) {
            console.log('Temporary error detected, maintaining admin state')
            // Don't reset isAdmin state on temporary errors
          } else {
            // Only reset on persistent/non-temporary errors
            setIsAdmin(false)
          }
        } else {
          setIsAdmin(Boolean(adminCheck))
          setLastCheck(now)
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        // Don't reset admin state on network errors to prevent privilege loss during form submissions
        if (error instanceof Error && (
            error.message?.includes('fetch') ||
            error.message?.includes('network') ||
            error.message?.includes('Failed to fetch') ||
            error.name === 'TypeError'
          )) {
          console.log('Network error detected, maintaining admin state')
          // Don't reset isAdmin state on network errors 
        } else {
          // Only reset on non-network errors
          setIsAdmin(false)
        }
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, lastCheck])

  return {
    isAdmin,
    loading,
    // Since all admins have all permissions, these are all the same as isAdmin
    canManageProducts: isAdmin,
    canManageCategories: isAdmin,
    canManageUsers: isAdmin,
    canManageAdmins: isAdmin
  }
}
