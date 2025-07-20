'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
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
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMasterAdmin, setIsMasterAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
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
      console.log('🔐 [AUTH] Checking admin status for user:', {
        userId: currentUser.id,
        email: currentUser.email,
        retryCount
      })

      // Add delay on retries to allow session to stabilize
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
      
      // Ensure we have a valid session before checking admin status
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session || session.user.id !== currentUser.id) {
        console.log('🔐 [AUTH] Invalid session during admin check:', {
          sessionError: sessionError?.message,
          hasSession: !!session,
          sessionUserId: session?.user?.id,
          currentUserId: currentUser.id
        })
        
        if (retryCount < 3) {
          console.log('🔄 [AUTH] Retrying admin check with fresh session...')
          setTimeout(() => checkAdminStatus(currentUser, retryCount + 1), 1500)
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
      cached: 'from getAdminStatusWithCache'
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
            rawResult: masterCheck
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
        retryCount
      })
      
      if (retryCount < 3) {
        console.log('🔄 [AUTH] Retrying admin check in 2 seconds...')
        setTimeout(() => checkAdminStatus(currentUser, retryCount + 1), 2000)
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
        console.log('🚀 [AUTH] Getting initial user session...')
        
        // First, try to get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('🚨 [AUTH] Session error:', sessionError.message)
        }
        
        if (session?.user) {
          console.log('✅ [AUTH] Found existing session for user:', {
            userId: session.user.id,
            email: session.user.email,
            expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
          })
          setUser(session.user)
          
          // Get user profile
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
          setUserProfile(profile)
          
          console.log('👤 [AUTH] User profile loaded:', profile ? 'success' : 'no profile found')
          
          // Check admin status with slight delay to ensure session is fully restored
          setTimeout(() => {
            checkAdminStatus(session.user)
          }, 100)
        } else {
          console.log('❌ [AUTH] No existing session found')
          setUser(null)
          setUserProfile(null)
          setIsAdmin(false)
          setIsMasterAdmin(false)
          setAdminChecked(true)
        }
      } catch (error) {
        console.error('💥 [AUTH] Error getting user:', error)
        setUser(null)
        setUserProfile(null)
        setIsAdmin(false)
        setIsMasterAdmin(false)
        setAdminChecked(true)
      } finally {
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
            hasSession: !!session
          })
          
          if (event === 'SIGNED_OUT') {
            console.log('🚪 [AUTH] User signed out - clearing state')
            setUser(null)
            setUserProfile(null)
            setIsAdmin(false)
            setIsMasterAdmin(false)
            setAdminChecked(true)
            // Clear cached admin status on sign out
            clearAdminCache()
            return
          }
          
          if (session?.user) {
            console.log('✅ [AUTH] User session updated:', {
              userId: session.user.id,
              email: session.user.email,
              event
            })
            setUser(session.user)
            
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('user_id', session.user.id)
              .single()
            setUserProfile(profile)
            
            console.log('👤 [AUTH] Profile updated:', profile ? 'success' : 'no profile')
            
            // Reset admin status and check again
            setAdminChecked(false)
            await checkAdminStatus(session.user)
          } else {
            console.log('❌ [AUTH] No user in session update')
            setUser(null)
            setUserProfile(null)
            setIsAdmin(false)
            setIsMasterAdmin(false)
            setAdminChecked(true)
          }
        } catch (error) {
          console.error('💥 [AUTH] Error in auth state change:', error)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, checkAdminStatus])

  const signOut = async () => {
    try {
      console.log('Starting logout process...')
      
      // Clear client-side auth state first
      console.log('Clearing client-side state...')
      setUser(null)
      setUserProfile(null)
      setIsAdmin(false)
      setIsMasterAdmin(false)
      setAdminChecked(true)
      
      // Clear cached admin status
      clearAdminCache()
      
      // Create promises for both logout operations
      console.log('Initiating Supabase and API logout...')
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
        console.log('Supabase signOut successful')
      } else {
        console.error('Supabase signOut error:', supabaseResult.reason)
      }
      
      if (apiResult.status === 'fulfilled') {
        console.log('API logout successful')
      } else {
        console.error('API logout error:', apiResult.reason)
      }
      
      console.log('Forcing page reload...')
      // Force a full page reload to ensure all state is cleared
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      // Force reload anyway to clear state
      window.location.href = '/'
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      isAdmin, 
      isMasterAdmin,
      loading: !mounted || loading || (!!user && !adminChecked), 
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
