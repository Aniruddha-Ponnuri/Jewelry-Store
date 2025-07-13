import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAdminStatusWithCache } from '@/lib/adminSession'

export function useAdmin() {
  const { user, isAdmin: contextIsAdmin, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastCheckedUser, setLastCheckedUser] = useState<string | null>(null)

  const checkAdminStatus = useCallback(async (userId: string) => {
    // Skip check if we already checked this user recently and auth is not loading
    if (lastCheckedUser === userId && !authLoading && contextIsAdmin !== undefined) {
      setLoading(false)
      return
    }

    try {
      console.log('useAdmin: Checking admin status for user:', userId)

      // Use enhanced admin status check with caching
      const adminStatus = await getAdminStatusWithCache(userId)
      
      console.log('useAdmin: Admin status result:', adminStatus)
      setIsAdmin(adminStatus)
      setLastCheckedUser(userId)
    } catch (error) {
      console.error('useAdmin: Error checking admin status:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }, [lastCheckedUser, authLoading, contextIsAdmin])

  useEffect(() => {
    if (authLoading) {
      setLoading(true)
      return
    }

    if (!user) {
      setIsAdmin(false)
      setLoading(false)
      setLastCheckedUser(null)
      return
    }

    // Primary source: Use context admin status if available and user matches
    if (contextIsAdmin !== undefined && contextIsAdmin !== null) {
      setIsAdmin(contextIsAdmin)
      setLoading(false)
      setLastCheckedUser(user.id)
      return
    }

    // Fallback: Direct check if context doesn't have admin status yet
    checkAdminStatus(user.id)
  }, [user, contextIsAdmin, authLoading, checkAdminStatus])

  return {
    isAdmin,
    loading,
    // Since all admins have all permissions in our simple system
    canManageProducts: isAdmin,
    canManageCategories: isAdmin,
    canManageUsers: isAdmin,
    canManageAdmins: isAdmin
  }
}
