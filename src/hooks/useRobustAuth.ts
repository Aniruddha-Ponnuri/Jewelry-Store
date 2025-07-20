'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface RobustAuthState {
  isAuthenticated: boolean
  isAdmin: boolean
  isMasterAdmin: boolean
  user: User | null
  loading: boolean
  error: string | null
  sessionValid: boolean
  lastVerification: number
}

interface RobustAuthOptions {
  refreshInterval?: number
  maxRetries?: number
  requireAuth?: boolean
  requireAdmin?: boolean
  requireMasterAdmin?: boolean
  redirectOnFail?: string
}

/**
 * Robust authentication hook that provides reliable auth state
 * with proper session management and admin verification
 */
export function useRobustAuth(options: RobustAuthOptions = {}) {
  const {
    refreshInterval = 60000, // 1 minute
    maxRetries = 3,
    requireAuth = false,
    requireAdmin = false,
    requireMasterAdmin = false,
    redirectOnFail = '/'
  } = options

  const router = useRouter()
  const [state, setState] = useState<RobustAuthState>({
    isAuthenticated: false,
    isAdmin: false,
    isMasterAdmin: false,
    user: null,
    loading: true,
    error: null,
    sessionValid: false,
    lastVerification: 0
  })

  // Enhanced verification function
  const verifyAuthState = useCallback(async (retryCount = 0): Promise<RobustAuthState> => {
    const supabase = createClient()
    const newState: RobustAuthState = {
      isAuthenticated: false,
      isAdmin: false,
      isMasterAdmin: false,
      user: null,
      loading: false,
      error: null,
      sessionValid: false,
      lastVerification: Date.now()
    }

    try {
      // Step 1: Verify session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`)
      }

      if (!session || !session.user) {
        return newState
      }

      // Check if session is expired
      const now = Date.now() / 1000
      if (session.expires_at && session.expires_at < now) {
        return newState
      }

      newState.isAuthenticated = true
      newState.user = session.user
      newState.sessionValid = true

      // Step 2: Always check admin status for authenticated users
      const { data: adminResult, error: adminError } = await supabase.rpc('is_admin')
      
      if (adminError) {
        console.warn('Admin check error:', adminError.message)
        // Don't throw error for admin check, just log it
        newState.isAdmin = false
      } else {
        newState.isAdmin = Boolean(adminResult)
      }

      // Step 3: Check master admin status if user is admin
      if (newState.isAdmin) {
        const { data: masterResult, error: masterError } = await supabase.rpc('is_master_admin')
        
        if (masterError) {
          console.warn('Master admin check error:', masterError.message)
          // Don't throw error for master admin check, just log it
          newState.isMasterAdmin = false
        } else {
          newState.isMasterAdmin = Boolean(masterResult)
        }
      }

      // Step 4: Validate requirements
      if (requireAuth && !newState.isAuthenticated) {
        throw new Error('Authentication required')
      }
      
      if (requireAdmin && !newState.isAdmin) {
        throw new Error('Admin privileges required')
      }
      
      if (requireMasterAdmin && !newState.isMasterAdmin) {
        throw new Error('Master admin privileges required')
      }

      return newState

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown auth error'

      // Retry logic
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
        return verifyAuthState(retryCount + 1)
      }

      newState.error = errorMessage
      return newState
    }
  }, [requireAuth, requireAdmin, requireMasterAdmin, maxRetries])

  // Update state and handle redirects
  const updateAuthState = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    const newState = await verifyAuthState()
    setState(newState)

    // Handle redirects based on requirements
    if (newState.error && (requireAuth || requireAdmin || requireMasterAdmin)) {
      if (!newState.isAuthenticated && requireAuth) {
        router.push('/login')
      } else {
        router.push(redirectOnFail)
      }
    }
  }, [verifyAuthState, requireAuth, requireAdmin, requireMasterAdmin, redirectOnFail, router])

  // Manual refresh function
  const refreshAuth = useCallback(async () => {
    console.log('🔐 [ROBUST AUTH] 🔄 Manual auth refresh requested')
    await updateAuthState()
  }, [updateAuthState])

  // Initial auth check
  useEffect(() => {
    updateAuthState()
  }, [updateAuthState])

  // Periodic refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        const timeSinceLastCheck = Date.now() - state.lastVerification
        if (timeSinceLastCheck >= refreshInterval) {
          console.log('🔐 [ROBUST AUTH] ⏰ Periodic auth refresh')
          updateAuthState()
        }
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [refreshInterval, state.lastVerification, updateAuthState])

  // Auth state change listener
  useEffect(() => {
    const supabase = createClient()
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 [ROBUST AUTH] 📡 Auth state change:', event, session?.user?.email)
      
      // Clear cache on sign out
      if (event === 'SIGNED_OUT') {
        setState({
          isAuthenticated: false,
          isAdmin: false,
          isMasterAdmin: false,
          user: null,
          loading: false,
          error: null,
          sessionValid: false,
          lastVerification: Date.now()
        })
        return
      }

      // Refresh auth state on other events
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await updateAuthState()
      }
    })

    return () => subscription.unsubscribe()
  }, [updateAuthState])

  return {
    ...state,
    refreshAuth,
    isReady: !state.loading,
    // Helper functions
    requiresAuth: requireAuth,
    requiresAdmin: requireAdmin,
    requiresMasterAdmin: requireMasterAdmin,
    // Status helpers
    canAccessAdminRoutes: state.isAdmin,
    canManageAdmins: state.isMasterAdmin,
    isFullyAuthorized: (!requireAuth || state.isAuthenticated) && 
                      (!requireAdmin || state.isAdmin) && 
                      (!requireMasterAdmin || state.isMasterAdmin)
  }
}
