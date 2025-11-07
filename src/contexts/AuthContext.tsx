'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'
import { getAdminStatusWithCache, clearAdminCache } from '@/lib/adminSession'
import { validateAdminStatus } from '@/lib/adminValidation'

interface AuthContextType {
  user: SupabaseUser | null
  userProfile: User | null
  isAdmin: boolean
  isMasterAdmin: boolean
  loading: boolean
  signOut: () => Promise<void>
  refreshAdminStatus: () => Promise<void>
  runFullAdminValidation: () => Promise<Record<string, unknown>>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMasterAdmin, setIsMasterAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  // adminChecked tracks internal admin validation state (kept for future use and debugging)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [adminChecked, setAdminChecked] = useState(false)
  const supabase = createClient()

  const checkAdminStatus = useCallback(async (currentUser: SupabaseUser | null, retryCount = 0) => {
    if (!currentUser) {
      console.log('🔐 [AUTH] No user provided for admin check')
      setIsAdmin(false)
      setIsMasterAdmin(false)
      setAdminChecked(true)
      clearAdminCache()
      return
    }

    try {
      console.log('🔐 [AUTH] Checking admin status:', {
        userId: currentUser.id,
        email: currentUser.email,
        retryCount,
        timestamp: new Date().toISOString()
      })

      // Add small delay on retries to allow session to stabilize
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 200)) // Reduced from 300ms to 200ms
      }
      
      // Ensure we have a valid session before checking admin status
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session || session.user.id !== currentUser.id) {
        console.log('🔐 [AUTH] Invalid session during admin check:', {
          sessionError: sessionError?.message,
          hasSession: !!session,
          sessionUserId: session?.user?.id,
          currentUserId: currentUser.id,
          timestamp: new Date().toISOString()
        })
        
        if (retryCount < 1) { // Already reduced from 2 to 1
          console.log('🔄 [AUTH] Retrying admin check with fresh session...')
          setTimeout(() => checkAdminStatus(currentUser, retryCount + 1), 500) // Reduced from 1000ms to 500ms
          return
        }
        
      setIsAdmin(false)
      setIsMasterAdmin(false)
      setAdminChecked(true)
      clearAdminCache()
      return
    }
    
    // Use enhanced admin status check with caching
    const adminStatus = await getAdminStatusWithCache(currentUser.id)
    
    console.log('🔐 [AUTH] Admin status result:', {
      userId: currentUser.id,
      email: currentUser.email,
      isAdmin: adminStatus,
      source: 'getAdminStatusWithCache',
      timestamp: new Date().toISOString()
    })
    
    setIsAdmin(adminStatus)
    
    // Check master admin status if user is admin
    let masterAdminStatus = false
    if (adminStatus) {
      try {
        const { data: masterCheck, error: masterError } = await supabase.rpc('is_master_admin')
        
        if (masterError) {
          console.error('🚨 [AUTH] Master admin check error:', masterError.message)
          masterAdminStatus = false
        } else {
          masterAdminStatus = Boolean(masterCheck)
          console.log('👑 [AUTH] Master admin status:', {
            userId: currentUser.id,
            email: currentUser.email,
            isMasterAdmin: masterAdminStatus,
            rawResult: masterCheck,
            timestamp: new Date().toISOString()
          })
        }
      } catch (masterError) {
        console.error('💥 [AUTH] Error checking master admin status:', masterError)
        masterAdminStatus = false
      }
    }
    
    setIsMasterAdmin(masterAdminStatus)
    setAdminChecked(true)      // Log additional validation
      if (adminStatus) {
        console.log('✅ [AUTH] User has admin privileges:', currentUser.email)
        
        // Double-check with direct database call for validation
        try {
          const { data: directCheck, error } = await supabase.rpc('is_admin')
          console.log('🔍 [AUTH] Direct DB admin check:', {
            result: directCheck,
            error: error?.message,
            matches: directCheck === adminStatus
          })
          
          // Check master admin status as well
          const { data: masterCheck, error: masterError } = await supabase.rpc('is_master_admin')
          console.log('👑 [AUTH] Master admin check:', {
            result: masterCheck,
            error: masterError?.message
          })
        } catch (validationError) {
          console.warn('⚠️ [AUTH] Admin validation error:', validationError)
        }
      } else {
        console.log('❌ [AUTH] User does not have admin privileges:', currentUser.email)
      }
    } catch (error) {
      console.error('🚨 [AUTH] Error checking admin status:', {
        userId: currentUser.id,
        email: currentUser.email,
        error: error instanceof Error ? error.message : error,
        retryCount,
        timestamp: new Date().toISOString()
      })
      
      if (retryCount < 1) { // Reduced retries
        console.log('🔄 [AUTH] Retrying admin check...')
        setTimeout(() => checkAdminStatus(currentUser, retryCount + 1), 500) // Reduced from 1000ms to 500ms
        return
      }
      
      console.error('💥 [AUTH] Max retries reached for admin check')
      setIsAdmin(false)
      setIsMasterAdmin(false)
      setAdminChecked(true)
      clearAdminCache()
    }
  }, [])
  const refreshAdminStatus = useCallback(async () => {
    console.log('🔄 [AUTH] Refreshing admin status...')
    setAdminChecked(false)
    setIsAdmin(false)
    setIsMasterAdmin(false)
    
    // Clear cached admin status to force fresh check
    clearAdminCache()
    console.log('🗑️ [AUTH] Admin cache cleared')
    
    if (user) {
      // Force a direct database check without cache
      try {
        console.log('🔍 [AUTH] Getting fresh session for admin refresh...')
        const supabase = createClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          console.log('❌ [AUTH] No valid session during refresh:', sessionError?.message)
          setIsAdmin(false)
          setIsMasterAdmin(false)
          setAdminChecked(true)
          return
        }
        
        console.log('✅ [AUTH] Valid session found, checking admin status directly...')
        const { data: adminCheck, error } = await supabase.rpc('is_admin')
        
        if (error) {
          console.error('🚨 [AUTH] Error refreshing admin status:', error.message)
          setIsAdmin(false)
          setIsMasterAdmin(false)
        } else {
          const adminStatus = Boolean(adminCheck)
          console.log('🔐 [AUTH] Refreshed admin status:', {
            userId: user.id,
            email: user.email,
            isAdmin: adminStatus,
            rawResult: adminCheck
          })
          setIsAdmin(adminStatus)
          
          // Check master admin status if user is admin
          let masterAdminStatus = false
          if (adminStatus) {
            try {
              const { data: masterCheck, error: masterError } = await supabase.rpc('is_master_admin')
              
              if (masterError) {
                console.error('🚨 [AUTH] Master admin refresh error:', masterError.message)
                masterAdminStatus = false
              } else {
                masterAdminStatus = Boolean(masterCheck)
                console.log('👑 [AUTH] Refreshed master admin status:', {
                  userId: user.id,
                  email: user.email,
                  isMasterAdmin: masterAdminStatus,
                  rawResult: masterCheck
                })
              }
            } catch (masterError) {
              console.error('💥 [AUTH] Error refreshing master admin status:', masterError)
              masterAdminStatus = false
            }
          }
          
          setIsMasterAdmin(masterAdminStatus)
          
          // Update cache with fresh status
          if (typeof window !== 'undefined') {
            try {
              const { cacheAdminStatus } = await import('@/lib/adminSession')
              cacheAdminStatus(user.id, adminStatus, session.access_token)
              console.log('💾 [AUTH] Admin status cached successfully')
            } catch {
              console.warn('⚠️ [AUTH] Failed to cache admin status')
            }
          }

          // Log additional verification for admins
          if (adminStatus) {
            try {
              const { data: masterCheck, error: masterError } = await supabase.rpc('is_master_admin')
              console.log('👑 [AUTH] Master admin status:', {
                result: masterCheck,
                error: masterError?.message
              })
              
              // Get admin record details
              const { data: adminRecord, error: recordError } = await supabase
                .from('admin_users')
                .select('*')
                .eq('user_id', user.id)
                .single()
              
              if (!recordError && adminRecord) {
                console.log('📋 [AUTH] Admin record details:', {
                  role: adminRecord.role,
                  isActive: adminRecord.is_active,
                  email: adminRecord.email,
                  createdAt: adminRecord.created_at
                })
              }
            } catch (verificationError) {
              console.warn('⚠️ [AUTH] Admin verification error:', verificationError)
            }
          }
        }
        
        setAdminChecked(true)
      } catch (error) {
        console.error('💥 [AUTH] Error in refreshAdminStatus:', error)
        setIsAdmin(false)
        setIsMasterAdmin(false)
        setAdminChecked(true)
      }
    } else {
      console.log('❌ [AUTH] No user available for admin refresh')
      setAdminChecked(true)
    }
  }, [user])

  // Full admin validation function for debugging
  const runFullAdminValidation = useCallback(async () => {
    console.log('🔐 [AUTH] Running full admin validation...')
    const result = await validateAdminStatus()
    console.log('🔐 [AUTH] Full validation result:', result)
    return result
  }, [])

  // Add validation functions to window for easy testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).validateAdmin = runFullAdminValidation;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).refreshAdminStatus = refreshAdminStatus
    }
  }, [runFullAdminValidation, refreshAdminStatus])

  useEffect(() => {
    setMounted(true)
    
    const getUser = async () => {
      try {
        console.log('🚀 [AUTH] Getting initial user session...', {
          timestamp: new Date().toISOString()
        })
        
        // First, try to get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('🚨 [AUTH] Session error:', sessionError.message)
        }
        
        if (session?.user) {
          console.log('✅ [AUTH] Found existing session:', {
            userId: session.user.id,
            email: session.user.email,
            expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown',
            timestamp: new Date().toISOString()
          })
          
          setUser(session.user)
          
          // CRITICAL: Set loading false IMMEDIATELY after user is set
          // This allows the UI to render without waiting for admin check
          setLoading(false)
          console.log('⚡ [AUTH] Loading state set to false - UI can render now')
          
          // Get user profile in background (non-blocking)
          supabase
            .from('users')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
            .then(({ data: profile }) => {
              setUserProfile(profile)
              console.log('👤 [AUTH] User profile loaded:', {
                hasProfile: !!profile,
                timestamp: new Date().toISOString()
              })
            })
          
          // Check admin status in background (non-blocking)
          console.log('🔐 [AUTH] Starting background admin check...')
          checkAdminStatus(session.user)
        } else {
          console.log('❌ [AUTH] No existing session found', {
            timestamp: new Date().toISOString()
          })
          setUser(null)
          setUserProfile(null)
          setIsAdmin(false)
          setIsMasterAdmin(false)
          setAdminChecked(true)
          setLoading(false)
        }
      } catch (error) {
        console.error('💥 [AUTH] Error getting user:', error)
        setUser(null)
        setUserProfile(null)
        setIsAdmin(false)
        setIsMasterAdmin(false)
        setAdminChecked(true)
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          console.log('🔄 [AUTH] Auth state change:', {
            event,
            userId: session?.user?.id,
            email: session?.user?.email,
            hasSession: !!session,
            timestamp: new Date().toISOString()
          })
          
          if (event === 'SIGNED_OUT') {
            console.log('🚪 [AUTH] User signed out - clearing state', {
              timestamp: new Date().toISOString()
            })
            setUser(null)
            setUserProfile(null)
            setIsAdmin(false)
            setIsMasterAdmin(false)
            setAdminChecked(true)
            // Clear cached admin status on sign out
            clearAdminCache()
            setLoading(false)
            return
          }
          
          if (session?.user) {
            console.log('✅ [AUTH] User session updated:', {
              userId: session.user.id,
              email: session.user.email,
              event,
              timestamp: new Date().toISOString()
            })
            setUser(session.user)
            
            // Set loading false immediately
            setLoading(false)
            
            // Load profile in background
            supabase
              .from('users')
              .select('*')
              .eq('user_id', session.user.id)
              .single()
              .then(({ data: profile }) => {
                setUserProfile(profile)
                console.log('👤 [AUTH] Profile updated:', {
                  hasProfile: !!profile,
                  timestamp: new Date().toISOString()
                })
              })
            
            // Reset admin status and check again in background
            setAdminChecked(false)
            console.log('🔐 [AUTH] Starting background admin check after state change...')
            checkAdminStatus(session.user)
          } else {
            console.log('❌ [AUTH] No user in session update', {
              event,
              timestamp: new Date().toISOString()
            })
            setUser(null)
            setUserProfile(null)
            setIsAdmin(false)
            setIsMasterAdmin(false)
            setAdminChecked(true)
            setLoading(false)
          }
        } catch (error) {
          console.error('💥 [AUTH] Error in auth state change:', error)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, checkAdminStatus])

  const signOut = async () => {
    try {
      console.log('🚪 [AUTH] Starting logout process...')
      
      // Clear client-side auth state first
      console.log('🧹 [AUTH] Clearing client-side state...')
      setUser(null)
      setUserProfile(null)
      setIsAdmin(false)
      setIsMasterAdmin(false)
      setAdminChecked(true)
      
      // Clear cached admin status
      clearAdminCache()
      
      // Create promises for both logout operations
      console.log('📡 [AUTH] Initiating Supabase and API logout...')
      const supabaseSignOut = supabase.auth.signOut()
      const apiLogout = fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      // Execute both operations in parallel
      const [supabaseResult, apiResult] = await Promise.allSettled([
        supabaseSignOut,
        apiLogout
      ])
      
      // Log results
      if (supabaseResult.status === 'fulfilled') {
        console.log('✅ [AUTH] Supabase signOut successful')
      } else {
        console.error('❌ [AUTH] Supabase signOut error:', supabaseResult.reason)
      }
      
      if (apiResult.status === 'fulfilled') {
        console.log('✅ [AUTH] API logout successful')
      } else {
        console.error('❌ [AUTH] API logout error:', apiResult.reason)
      }
      
      console.log('🔄 [AUTH] Navigating to homepage...')
      // Use Next.js router for smooth navigation
      router.push('/')
      router.refresh() // Force refresh to clear cached data
      
      // Small delay then force reload to ensure everything is cleared
      setTimeout(() => {
        window.location.href = '/'
      }, 20000)
    } catch (error) {
      console.error('❌ [AUTH] Logout error:', error)
      // Force reload anyway to clear state
      router.push('/')
      setTimeout(() => {
        window.location.href = '/'
      }, 20000)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      isAdmin, 
      isMasterAdmin,
      // OPTIMIZED: Don't wait for adminChecked - let UI render immediately when user is loaded
      // Admin checks happen in background and update state when complete
      loading: !mounted || loading, 
      signOut, 
      refreshAdminStatus,
      runFullAdminValidation
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
