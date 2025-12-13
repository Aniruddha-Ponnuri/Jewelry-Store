'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface RobustAuthOptions {
  requireAuth?: boolean
  requireAdmin?: boolean
  requireMasterAdmin?: boolean
  redirectOnFail?: string
  refreshInterval?: number // Kept for backward compatibility (ignored)
  maxRetries?: number // Kept for backward compatibility (ignored)
}

/**
 * Simplified auth hook that wraps useAuth
 * Handles authorization requirements and redirects
 */
export function useRobustAuth(options: RobustAuthOptions = {}) {
  const {
    requireAuth = false,
    requireAdmin = false,
    requireMasterAdmin = false,
    redirectOnFail = '/'
  } = options

  const router = useRouter()
  const auth = useAuth()
  const [lastVerification] = useState(() => Date.now())

  // Handle authorization redirects
  useEffect(() => {
    // Wait for auth to initialize
    if (auth.loading) return

    // Check requirements
    if (requireAuth && !auth.user) {
      router.push('/login')
      return
    }

    if (requireAdmin && !auth.isAdmin) {
      router.push(redirectOnFail)
      return
    }

    if (requireMasterAdmin && !auth.isMasterAdmin) {
      router.push(redirectOnFail)
      return
    }
  }, [auth.loading, auth.user, auth.isAdmin, auth.isMasterAdmin, requireAuth, requireAdmin, requireMasterAdmin, redirectOnFail, router])

  return {
    // Core auth state
    user: auth.user,
    isAuthenticated: !!auth.user,
    isAdmin: auth.isAdmin,
    isMasterAdmin: auth.isMasterAdmin,
    loading: auth.loading,

    // Actions
    signOut: auth.signOut,
    refreshAdminStatus: auth.refreshAdminStatus,
    refreshAuth: auth.refreshAdminStatus, // Alias

    // Status helpers
    isReady: !auth.loading,
    sessionValid: !!auth.user,
    error: null,
    lastVerification, // For backward compatibility

    // Authorization helpers
    canAccessAdminRoutes: auth.isAdmin,
    canManageAdmins: auth.isMasterAdmin,
    isFullyAuthorized: (!requireAuth || !!auth.user) &&
                       (!requireAdmin || auth.isAdmin) &&
                       (!requireMasterAdmin || auth.isMasterAdmin)
  }
}
