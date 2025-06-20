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
        setIsAdmin(false)
        setAdminPermissions(null)
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
      setIsAdmin(false)
      setAdminPermissions(null)
    }
  }, [supabase])

  const refreshAdminStatus = async () => {
    await checkAdminStatus(user)
  }

  useEffect(() => {
    setMounted(true)
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', user.id)
          .single()
        setUserProfile(profile)
        
        // Check admin status
        await checkAdminStatus(user)
      }
      
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
        
        setLoading(false)
      }    )

    return () => subscription.unsubscribe()
  }, [supabase, checkAdminStatus])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <AuthContext.Provider value={{ 
        user: null, 
        userProfile: null, 
        isAdmin: false, 
        adminPermissions: null, 
        loading: true, 
        signOut: async () => {},
        refreshAdminStatus: async () => {}
      }}>
        {children}
      </AuthContext.Provider>
    )
  }
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
      setIsAdmin(false)
      setAdminPermissions(null)
      // Use router instead of window.location for better UX
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
      adminPermissions, 
      loading, 
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
