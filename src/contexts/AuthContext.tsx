'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'
import { logger } from '@/lib/logger'

interface AuthContextType {
  user: SupabaseUser | null
  userProfile: User | null
  isAdmin: boolean
  isMasterAdmin: boolean
  loading: boolean
  signOut: () => Promise<void>
  refreshAdminStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Admin status cache with 5-minute TTL
const ADMIN_CACHE_TTL = 5 * 60 * 1000
let adminCache: { userId: string; isAdmin: boolean; isMasterAdmin: boolean; timestamp: number } | null = null

function getCachedAdminStatus(userId: string) {
  if (!adminCache || adminCache.userId !== userId) return null
  if (Date.now() - adminCache.timestamp > ADMIN_CACHE_TTL) {
    adminCache = null
    return null
  }
  return { isAdmin: adminCache.isAdmin, isMasterAdmin: adminCache.isMasterAdmin }
}

function setCachedAdminStatus(userId: string, isAdmin: boolean, isMasterAdmin: boolean) {
  adminCache = { userId, isAdmin, isMasterAdmin, timestamp: Date.now() }
}

function clearAdminCache() {
  adminCache = null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMasterAdmin, setIsMasterAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const initializingRef = useRef(false)
  const adminCheckInProgressRef = useRef(false)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }, [])

  const checkAdminStatus = useCallback(async (currentUser: SupabaseUser | null) => {
    if (!currentUser) {
      setIsAdmin(false)
      setIsMasterAdmin(false)
      clearAdminCache()
      return
    }

    if (adminCheckInProgressRef.current) {
      logger.debug('Admin check in progress, skipping')
      return
    }

    const cached = getCachedAdminStatus(currentUser.id)
    if (cached) {
      logger.debug('Using cached admin status')
      setIsAdmin(cached.isAdmin)
      setIsMasterAdmin(cached.isMasterAdmin)
      return
    }

    adminCheckInProgressRef.current = true
    const startTime = Date.now()
    const userId = currentUser.id.slice(0, 8)

    try {
      const supabase = getSupabase()
      const { data: adminResult, error: adminError } = await supabase.rpc('is_admin')

      if (adminError) {
        logger.warn('Admin RPC failed', { userId, error: adminError.message })
        setIsAdmin(false)
        setIsMasterAdmin(false)
        clearAdminCache()
        return
      }

      const isAdminUser = Boolean(adminResult)
      let isMasterAdminUser = false

      if (isAdminUser) {
        const { data: masterResult } = await supabase.rpc('is_master_admin')
        isMasterAdminUser = Boolean(masterResult)
      }

      logger.auth('Admin status check completed', {
        userId: `${userId}...`,
        isAdmin: isAdminUser,
        isMasterAdmin: isMasterAdminUser,
        durationMs: Date.now() - startTime
      })

      setIsAdmin(isAdminUser)
      setIsMasterAdmin(isMasterAdminUser)
      setCachedAdminStatus(currentUser.id, isAdminUser, isMasterAdminUser)

    } catch (error) {
      logger.error('Admin check exception', error)
      setIsAdmin(false)
      setIsMasterAdmin(false)
      clearAdminCache()
    } finally {
      adminCheckInProgressRef.current = false
    }
  }, [getSupabase])

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const supabase = getSupabase()
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profile) {
        setUserProfile(profile)
        logger.debug('User profile loaded')
      }
    } catch (error) {
      logger.warn('Failed to load user profile', error)
    }
  }, [getSupabase])

  const refreshAdminStatus = useCallback(async () => {
    logger.auth('Refreshing admin status')
    clearAdminCache()
    if (user) {
      await checkAdminStatus(user)
    }
  }, [user, checkAdminStatus])

  useEffect(() => {
    if (initializingRef.current) return
    initializingRef.current = true
    setMounted(true)

    const supabase = getSupabase()

    const initializeAuth = async () => {
      const startTime = Date.now()
      logger.auth('Initializing auth context')

      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          logger.warn('Session fetch error', { error: error.message })
          setLoading(false)
          return
        }

        if (session?.user) {
          const userId = session.user.id.slice(0, 8)
          logger.auth('Session found', {
            userId: `${userId}...`,
            expiresAt: session.expires_at
          })

          setUser(session.user)
          setLoading(false)

          loadUserProfile(session.user.id)
          checkAdminStatus(session.user)

          logger.perf('Auth init', startTime, { hasSession: true })
        } else {
          logger.auth('No session found')
          setLoading(false)
          logger.perf('Auth init', startTime, { hasSession: false })
        }
      } catch (error) {
        logger.error('Auth initialization failed', error)
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.auth('Auth state changed', {
          event,
          hasSession: !!session,
          userId: session?.user?.id?.slice(0, 8)
        })

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserProfile(null)
          setIsAdmin(false)
          setIsMasterAdmin(false)
          clearAdminCache()
          setLoading(false)
          return
        }

        if (session?.user) {
          setUser(session.user)
          setLoading(false)

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            loadUserProfile(session.user.id)
            checkAdminStatus(session.user)
          }
        } else {
          setUser(null)
          setUserProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      initializingRef.current = false
    }
  }, [getSupabase, loadUserProfile, checkAdminStatus])

  const signOut = useCallback(async () => {
    logger.auth('Sign out initiated')

    try {
      setUser(null)
      setUserProfile(null)
      setIsAdmin(false)
      setIsMasterAdmin(false)
      clearAdminCache()

      const supabase = getSupabase()

      await Promise.allSettled([
        supabase.auth.signOut(),
        fetch('/api/auth/logout', { method: 'POST' })
      ])

      logger.auth('Sign out completed, redirecting')
      window.location.href = '/'
    } catch (error) {
      logger.error('Sign out error', error)
      window.location.href = '/'
    }
  }, [getSupabase])

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAdmin,
        isMasterAdmin,
        loading: !mounted || loading,
        signOut,
        refreshAdminStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }
