'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'

interface AdminPermissions {
  products: boolean
  categories: boolean
  users: boolean
}

interface AuthContextType {
  user: SupabaseUser | null
  userProfile: User | null
  isAdmin: boolean
  adminPermissions: AdminPermissions | null
  loading: boolean
  signOut: () => Promise<void>
  forceSignOut: () => Promise<void>
  refreshAdminStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPermissions, setAdminPermissions] = useState<AdminPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  const checkAdminStatus = useCallback(async (currentUser: SupabaseUser | null) => {
    if (!currentUser) {
      setIsAdmin(false)
      setAdminPermissions(null)
      return
    }

    try {
      // Use the is_admin function from the new admin system
      const { data: adminCheck, error } = await supabase.rpc('is_admin')

      if (error) {
        console.error('Error checking admin status:', error)
        // Don't immediately reset admin state on error to prevent loss during form submissions
        if (error.message?.includes('JWT') || error.message?.includes('session') || 
            error.message?.includes('fetch') || error.message?.includes('network')) {
          console.log('Temporary error detected, maintaining admin state and retrying admin check')
          // Retry after a delay without resetting admin state
          setTimeout(() => checkAdminStatus(currentUser), 2000)
          return // Don't reset admin state
        } else {
          // Only reset on non-temporary errors
          console.log('Persistent error, resetting admin state')
          setIsAdmin(false)
          setAdminPermissions(null)
        }
      } else {
        const isAdminUser = Boolean(adminCheck)
        setIsAdmin(isAdminUser)
        // In the new system, all admins have all permissions
        setAdminPermissions(isAdminUser ? {
          products: true,
          categories: true,
          users: true
        } : null)
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      // Don't immediately reset admin state on network errors to prevent loss during form submissions
      if (error instanceof Error && (
          error.message?.includes('fetch') || 
          error.message?.includes('network') ||
          error.message?.includes('Failed to fetch') ||
          error.name === 'TypeError'
        )) {
        console.log('Network/fetch error detected, maintaining admin state and retrying admin check')
        setTimeout(() => checkAdminStatus(currentUser), 3000)
        return // Don't reset admin state
      } else {
        // Only reset on non-network errors
        console.log('Non-network error, resetting admin state')
        setIsAdmin(false)
        setAdminPermissions(null)
      }
    }
  }, [supabase])
  const refreshAdminStatus = async () => {
    await checkAdminStatus(user)
  }

  useEffect(() => {
    setMounted(true)
    
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          // Get user profile and admin status in parallel
          const [profileResult, adminResult] = await Promise.allSettled([
            supabase.from('users').select('*').eq('user_id', user.id).single(),
            supabase.rpc('is_admin')
          ])
          
          if (profileResult.status === 'fulfilled') {
            setUserProfile(profileResult.value.data)
          }
          
          if (adminResult.status === 'fulfilled') {
            const isAdminUser = Boolean(adminResult.value.data)
            setIsAdmin(isAdminUser)
            setAdminPermissions(isAdminUser ? {
              products: true,
              categories: true,
              users: true
            } : null)
          }
        }
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setUser(session?.user || null)
          
          if (session?.user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('user_id', session.user.id)
              .single()
            setUserProfile(profile)
            
            await checkAdminStatus(session.user)
          } else {
            setUserProfile(null)
            setIsAdmin(false)
            setAdminPermissions(null)
          }
        } catch (error) {
          console.error('Error in auth state change:', error)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()  }, [supabase, checkAdminStatus])

  const signOut = async () => {
    try {
      console.log('Starting logout process...')
      
      // Clear client-side auth state first
      console.log('Clearing client-side state...')
      setUser(null)
      setUserProfile(null)
      setIsAdmin(false)
      setAdminPermissions(null)
      
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

  const forceSignOut = async () => {
    try {
      console.log('Starting force logout...')
      
      // Clear client-side auth state immediately
      setUser(null)
      setUserProfile(null)
      setIsAdmin(false)
      setAdminPermissions(null)
      
      // Only try Supabase client logout
      await supabase.auth.signOut()
      
      // Clear localStorage/sessionStorage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // Force reload
      window.location.href = '/'
    } catch (error) {
      console.error('Force logout error:', error)
      // Force reload anyway
      window.location.href = '/'
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      isAdmin, 
      adminPermissions, 
      loading: !mounted || loading, 
      signOut, 
      forceSignOut,
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
