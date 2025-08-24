'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { User, Session } from '@supabase/supabase-js'
import { 
  sessionManager, 
  secureLogger, 
  rateLimiter, 
  inputValidator,
  type SecurityConfig 
} from '@/lib/auth/security'
import { createClient } from '@/lib/supabase/client'

// Enhanced auth state interface
export interface SecureAuthState {
  // Core auth state
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Admin state
  isAdmin: boolean
  isMasterAdmin: boolean
  adminPermissions: {
    products: boolean
    categories: boolean
    users: boolean
    admins: boolean
  } | null
  
  // Security state
  sessionValid: boolean
  needsRefresh: boolean
  lastVerification: number
  securityScore: number
  
  // Error handling
  error: string | null
  retryCount: number
  
  // Rate limiting
  rateLimited: boolean
  remainingAttempts: number
}

export interface SecureAuthConfig {
  // Refresh settings
  autoRefresh: boolean
  refreshInterval: number
  maxRetries: number
  
  // Security requirements
  requireAuth: boolean
  requireAdmin: boolean
  requireMasterAdmin: boolean
  
  // Redirect settings
  loginRedirect: string
  logoutRedirect: string
  unauthorizedRedirect: string
  
  // Session validation
  validateOnFocus: boolean
  validateOnVisibilityChange: boolean
  
  // Security options
  securityConfig?: Partial<SecurityConfig>
}

const DEFAULT_CONFIG: SecureAuthConfig = {
  autoRefresh: true,
  refreshInterval: 60000, // 1 minute
  maxRetries: 3,
  requireAuth: false,
  requireAdmin: false,
  requireMasterAdmin: false,
  loginRedirect: '/login',
  logoutRedirect: '/',
  unauthorizedRedirect: '/',
  validateOnFocus: true,
  validateOnVisibilityChange: true,
}

/**
 * Production-ready secure authentication hook
 * Provides comprehensive auth state management with security features
 */
export function useSecureAuth(config: Partial<SecureAuthConfig> = {}): SecureAuthState & {
  // Auth actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
  
  // Admin actions
  refreshAdminStatus: () => Promise<void>
  
  // Security actions
  validateSession: () => Promise<boolean>
  resetRateLimit: () => void
  
  // Utility functions
  requiresAuth: boolean
  requiresAdmin: boolean
  requiresMasterAdmin: boolean
  isFullyAuthorized: boolean
  canAccessAdmin: boolean
  canManageUsers: boolean
} {
  // Memoize the configuration to prevent unnecessary re-renders
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])
  const router = useRouter()
  
  // Refs for cleanup and preventing multiple requests
  const refreshTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const abortControllerRef = useRef<AbortController | undefined>(undefined)
  const isRefreshingRef = useRef(false)
  
  // Main auth state
  const [state, setState] = useState<SecureAuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
    isAdmin: false,
    isMasterAdmin: false,
    adminPermissions: null,
    sessionValid: false,
    needsRefresh: false,
    lastVerification: 0,
    securityScore: 0,
    error: null,
    retryCount: 0,
    rateLimited: false,
    remainingAttempts: 5,
  })

  // Calculate security score based on various factors
  const calculateSecurityScore = useCallback((
    session: Session | null, 
    isAdmin: boolean, 
    sessionAge: number
  ): number => {
    let score = 0
    
    // Base score for valid session
    if (session) score += 30
    
    // Recent session bonus
    if (sessionAge < 60 * 60 * 1000) score += 20 // Less than 1 hour
    
    // Admin verification bonus
    if (isAdmin) score += 20
    
    // Fresh token bonus
    if (session && session.expires_at) {
      const expiresIn = session.expires_at * 1000 - Date.now()
      if (expiresIn > 30 * 60 * 1000) score += 30 // More than 30 minutes left
    }
    
    return Math.min(100, score)
  }, [])

  // Comprehensive auth state verification
  const verifyAuthState = useCallback(async (retryCount = 0): Promise<Partial<SecureAuthState>> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal
    
    try {
      secureLogger.info('Starting auth verification', { retryCount })
      
      // Step 1: Validate and refresh session if needed
      const sessionResult = await sessionManager.refreshSessionIfNeeded(false)
      
      if (signal.aborted) return {}
      
      if (!sessionResult.isValid) {
        secureLogger.info('Invalid session detected', { reason: sessionResult.reason })
        
        // Auto-logout on session expiry
        if (sessionResult.reason === 'expired' || sessionResult.reason === 'refresh_failed') {
          secureLogger.info('Session expired - triggering auto logout')
          // Clear session and force redirect to login
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              sessionManager.clearSession(false)
              window.location.href = finalConfig.loginRedirect
            }
          }, 100)
        }
        
        return {
          user: null,
          session: null,
          isAuthenticated: false,
          sessionValid: false,
          isAdmin: false,
          isMasterAdmin: false,
          adminPermissions: null,
          error: sessionResult.reason === 'expired' ? 'Session expired' : null,
          lastVerification: Date.now(),
          securityScore: 0,
        }
      }
      
      const { session } = sessionResult
      if (!session || !session.user) {
        // Check if this is due to token expiry
        if (sessionResult.reason === 'expired') {
          secureLogger.info('User session expired - auto logout initiated')
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              sessionManager.clearSession(false)
              window.location.href = finalConfig.loginRedirect
            }
          }, 100)
        }
        
        return {
          user: null,
          session: null,
          isAuthenticated: false,
          sessionValid: false,
          isAdmin: false,
          isMasterAdmin: false,
          adminPermissions: null,
          lastVerification: Date.now(),
          securityScore: 0,
        }
      }
      
      if (signal.aborted) return {}
      
      // Step 2: Verify admin status
      const supabase = createClient()
      let isAdmin = false
      let isMasterAdmin = false
      let adminPermissions = null
      
      try {
        const { data: adminResult, error: adminError } = await supabase.rpc('is_admin')
        
        if (signal.aborted) return {}
        
        if (!adminError) {
          isAdmin = Boolean(adminResult)
          
          if (isAdmin) {
            // Check master admin status
            const { data: masterResult, error: masterError } = await supabase.rpc('is_master_admin')
            
            if (signal.aborted) return {}
            
            if (!masterError) {
              isMasterAdmin = Boolean(masterResult)
            }
            
            // Get admin permissions
            try {
              const { data: permissionsResult, error: permissionsError } = await supabase.rpc('get_admin_permissions')
              
              if (!permissionsError && permissionsResult) {
                adminPermissions = permissionsResult
              }
            } catch (permError) {
              secureLogger.warn('Failed to get admin permissions', { 
                error: permError instanceof Error ? permError.message : 'Unknown error' 
              })
            }
          }
        } else {
          secureLogger.warn('Admin check failed', adminError)
        }
      } catch (adminError) {
        secureLogger.error('Error checking admin status', adminError)
      }
      
      if (signal.aborted) return {}
      
      // Step 3: Calculate security metrics
      const now = Date.now()
      const sessionAge = session.issued_at ? now - (session.issued_at * 1000) : 0
      const securityScore = calculateSecurityScore(session, isAdmin, sessionAge)
      
      const newState: Partial<SecureAuthState> = {
        user: session.user,
        session,
        isAuthenticated: true,
        sessionValid: true,
        needsRefresh: sessionResult.reason === 'refreshed',
        isAdmin,
        isMasterAdmin,
        adminPermissions,
        lastVerification: now,
        securityScore,
        error: null,
        retryCount: 0,
      }
      
      // Step 4: Validate requirements
      if (finalConfig.requireAuth && !newState.isAuthenticated) {
        throw new Error('Authentication required')
      }
      
      if (finalConfig.requireAdmin && !newState.isAdmin) {
        throw new Error('Admin privileges required')
      }
      
      if (finalConfig.requireMasterAdmin && !newState.isMasterAdmin) {
        throw new Error('Master admin privileges required')
      }
      
      secureLogger.info('Auth verification successful', {
        userId: session.user.id,
        isAdmin,
        isMasterAdmin,
        securityScore,
      })
      
      return newState
      
    } catch (error) {
      if (signal.aborted) return {}
      
      const errorMessage = error instanceof Error ? error.message : 'Authentication error'
      secureLogger.error('Auth verification failed', error)
      
      // Retry logic
      if (retryCount < finalConfig.maxRetries && !errorMessage.includes('required')) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
        return verifyAuthState(retryCount + 1)
      }
      
      return {
        error: errorMessage,
        retryCount: retryCount + 1,
        lastVerification: Date.now(),
        securityScore: 0,
      }
    }
  }, [finalConfig, calculateSecurityScore])

  // Update auth state
  const updateAuthState = useCallback(async () => {
    if (isRefreshingRef.current) return
    
    isRefreshingRef.current = true
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const newState = await verifyAuthState()
      
      setState(prev => ({
        ...prev,
        ...newState,
        isLoading: false,
      }))
      
      // Handle redirects based on requirements and errors
      if (newState.error) {
        if (newState.error.includes('Authentication required')) {
          router.push(finalConfig.loginRedirect)
        } else if (newState.error.includes('privileges required')) {
          router.push(finalConfig.unauthorizedRedirect)
        }
      }
    } finally {
      isRefreshingRef.current = false
    }
  }, [verifyAuthState, router, finalConfig])

  // Sign in function with security checks
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      // Input validation
      const emailValidation = inputValidator.validateEmail(email)
      if (!emailValidation.isValid) {
        return { success: false, error: 'Please enter a valid email address' }
      }
      
      const passwordValidation = inputValidator.validatePassword(password)
      if (!passwordValidation.isValid) {
        return { success: false, error: 'Password does not meet security requirements' }
      }
      
      // Rate limiting check
      const clientId = `email:${email}`
      if (!rateLimiter.checkLimit(clientId)) {
        setState(prev => ({ ...prev, rateLimited: true, remainingAttempts: 0 }))
        return { success: false, error: 'Too many failed attempts. Please try again later.' }
      }
      
      // Attempt sign in
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: inputValidator.sanitizeInput(email),
        password,
      })
      
      // Record attempt for rate limiting
      rateLimiter.recordAttempt(clientId, !error, email)
      
      if (error) {
        secureLogger.warn('Sign-in failed', { email: inputValidator.sanitizeInput(email), error: error.message })
        
        // Update remaining attempts
        const attempts = rateLimiter.checkLimit(clientId) ? 4 : 0 // Simplified calculation
        setState(prev => ({ ...prev, remainingAttempts: attempts }))
        
        return { success: false, error: error.message }
      }
      
      if (!data.session) {
        return { success: false, error: 'Failed to establish session' }
      }
      
      secureLogger.info('Sign-in successful', { userId: data.user.id })
      
      // Reset rate limiting on success
      rateLimiter.reset(clientId)
      setState(prev => ({ ...prev, rateLimited: false, remainingAttempts: 5 }))
      
      // Trigger auth state update
      await updateAuthState()
      
      return { success: true }
      
    } catch (error) {
      secureLogger.error('Sign-in error', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }, [updateAuthState])

  // Secure sign out
  const signOut = useCallback(async () => {
    try {
      secureLogger.info('Starting sign-out process')
      
      // Clear auth state immediately
      setState(prev => ({
        ...prev,
        user: null,
        session: null,
        isAuthenticated: false,
        isAdmin: false,
        isMasterAdmin: false,
        adminPermissions: null,
        sessionValid: false,
        securityScore: 0,
      }))
      
      // Clear session
      await sessionManager.clearSession(false)
      
      // Clear timeouts
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      
      secureLogger.info('Sign-out completed')
      
      // Redirect
      router.push(finalConfig.logoutRedirect)
      
    } catch (error) {
      secureLogger.error('Sign-out error', error)
      // Force redirect even on error
      router.push(finalConfig.logoutRedirect)
    }
  }, [router, finalConfig])

  // Manual auth refresh
  const refreshAuth = useCallback(async () => {
    secureLogger.info('Manual auth refresh requested')
    await updateAuthState()
  }, [updateAuthState])

  // Admin status refresh
  const refreshAdminStatus = useCallback(async () => {
    if (!state.user) return
    
    try {
      const supabase = createClient()
      const { data: adminResult } = await supabase.rpc('is_admin')
      const { data: masterResult } = await supabase.rpc('is_master_admin')
      const { data: permissionsResult } = await supabase.rpc('get_admin_permissions')
      
      setState(prev => ({
        ...prev,
        isAdmin: Boolean(adminResult),
        isMasterAdmin: Boolean(masterResult),
        adminPermissions: permissionsResult || null,
      }))
      
      secureLogger.info('Admin status refreshed', {
        isAdmin: Boolean(adminResult),
        isMasterAdmin: Boolean(masterResult),
      })
    } catch (error) {
      secureLogger.error('Failed to refresh admin status', error)
    }
  }, [state.user])

  // Session validation
  const validateSession = useCallback(async (): Promise<boolean> => {
    const validation = await sessionManager.validateSession()
    return validation.isValid
  }, [])

  // Reset rate limiting
  const resetRateLimit = useCallback(() => {
    setState(prev => ({ ...prev, rateLimited: false, remainingAttempts: 5 }))
  }, [])

  // Initial auth check
  useEffect(() => {
    updateAuthState()
  }, [updateAuthState])

  // Auto-refresh setup
  useEffect(() => {
    if (!finalConfig.autoRefresh || !state.isAuthenticated) return
    
    const setupRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        if (state.isAuthenticated) {
          updateAuthState()
        }
      }, finalConfig.refreshInterval)
    }
    
    setupRefresh()
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [finalConfig.autoRefresh, finalConfig.refreshInterval, state.isAuthenticated, updateAuthState])

  // Window focus validation
  useEffect(() => {
    if (!finalConfig.validateOnFocus) return
    
    const handleFocus = () => {
      if (state.isAuthenticated) {
        updateAuthState()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [finalConfig.validateOnFocus, state.isAuthenticated, updateAuthState])

  // Visibility change validation
  useEffect(() => {
    if (!finalConfig.validateOnVisibilityChange) return
    
    const handleVisibilityChange = () => {
      if (!document.hidden && state.isAuthenticated) {
        updateAuthState()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [finalConfig.validateOnVisibilityChange, state.isAuthenticated, updateAuthState])

  // Auth state change listener
  useEffect(() => {
    const supabase = createClient()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      secureLogger.info('Auth state change detected', { event, hasSession: !!session })
      
      if (event === 'SIGNED_OUT') {
        setState(prev => ({
          ...prev,
          user: null,
          session: null,
          isAuthenticated: false,
          isAdmin: false,
          isMasterAdmin: false,
          adminPermissions: null,
          sessionValid: false,
          securityScore: 0,
          error: null,
        }))
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await updateAuthState()
      }
    })
    
    return () => subscription.unsubscribe()
  }, [updateAuthState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Computed properties
  const requiresAuth = finalConfig.requireAuth
  const requiresAdmin = finalConfig.requireAdmin
  const requiresMasterAdmin = finalConfig.requireMasterAdmin
  const isFullyAuthorized = (!requiresAuth || state.isAuthenticated) && 
                           (!requiresAdmin || state.isAdmin) && 
                           (!requiresMasterAdmin || state.isMasterAdmin)
  const canAccessAdmin = state.isAdmin
  const canManageUsers = state.isMasterAdmin || (state.adminPermissions?.users ?? false)

  return {
    // State
    ...state,
    
    // Actions
    signIn,
    signOut,
    refreshAuth,
    refreshAdminStatus,
    validateSession,
    resetRateLimit,
    
    // Computed properties
    requiresAuth,
    requiresAdmin,
    requiresMasterAdmin,
    isFullyAuthorized,
    canAccessAdmin,
    canManageUsers,
  }
}
