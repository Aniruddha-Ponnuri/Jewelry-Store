'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'
import { getAdminStatusWithCache, clearAdminCache } from '@/lib/adminSession'
import '@/lib/debugAuth' // Import debug helper

interface AuthContextType {
  user: SupabaseUser | null
  userProfile: User | null
  isAdmin: boolean
  loading: boolean
  signOut: () => Promise<void>
  refreshAdminStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [adminChecked, setAdminChecked] = useState(false)
  const supabase = createClient()

  const checkAdminStatus = useCallback(async (currentUser: SupabaseUser | null, retryCount = 0) => {
    if (!currentUser) {
      setIsAdmin(false)
      setAdminChecked(true)
      clearAdminCache()
      return
    }

    try {
      console.log('Checking admin status for user:', currentUser.id)
      
      // Use enhanced admin status check with caching
      const adminStatus = await getAdminStatusWithCache(currentUser.id)
      
      console.log('Admin status result:', adminStatus)
      setIsAdmin(adminStatus)
      setAdminChecked(true)
    } catch (error) {
      console.error('Error checking admin status:', error)
      if (retryCount < 2) {
        setTimeout(() => checkAdminStatus(currentUser, retryCount + 1), 1000)
        return
      }
      setIsAdmin(false)
      setAdminChecked(true)
      clearAdminCache()
    }
  }, [])
  const refreshAdminStatus = async () => {
    setAdminChecked(false)
    // Clear cached admin status
    clearAdminCache()
    await checkAdminStatus(user)
  }

  useEffect(() => {
    setMounted(true)
    
    const getUser = async () => {
      try {
        console.log('Getting initial user session...')
        
        // First, try to get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
        }
        
        if (session?.user) {
          console.log('Found existing session for user:', session.user.id)
          setUser(session.user)
          
          // Get user profile
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
          setUserProfile(profile)
          
          // Check admin status with slight delay to ensure session is fully restored
          setTimeout(() => {
            checkAdminStatus(session.user)
          }, 100)
        } else {
          console.log('No existing session found')
          setUser(null)
          setUserProfile(null)
          setIsAdmin(false)
          setAdminChecked(true)
        }
      } catch (error) {
        console.error('Error getting user:', error)
        setUser(null)
        setUserProfile(null)
        setIsAdmin(false)
        setAdminChecked(true)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          console.log('Auth state change:', event, session?.user?.id)
          
          if (event === 'SIGNED_OUT') {
            setUser(null)
            setUserProfile(null)
            setIsAdmin(false)
            setAdminChecked(true)
            // Clear cached admin status on sign out
            clearAdminCache()
            return
          }
          
          if (session?.user) {
            setUser(session.user)
            
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('user_id', session.user.id)
              .single()
            setUserProfile(profile)
            
            // Reset admin status and check again
            setAdminChecked(false)
            await checkAdminStatus(session.user)
          } else {
            setUser(null)
            setUserProfile(null)
            setIsAdmin(false)
            setAdminChecked(true)
          }
        } catch (error) {
          console.error('Error in auth state change:', error)
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
      loading: !mounted || loading || (!!user && !adminChecked), 
      signOut, 
      refreshAdminStatus 
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
