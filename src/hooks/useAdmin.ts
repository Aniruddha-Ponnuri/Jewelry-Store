import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export function useAdmin() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()

        // Check if user is admin using the simple is_admin function
        const { data: adminCheck, error } = await supabase.rpc('is_admin')
        
        if (error) {
          console.error('Error checking admin status:', error)
          setIsAdmin(false)
        } else {
          setIsAdmin(Boolean(adminCheck))
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [user])

  return {
    isAdmin,
    loading,
    // Since all admins have all permissions, these are all the same as isAdmin
    canManageProducts: isAdmin,
    canManageCategories: isAdmin,
    canManageUsers: isAdmin,
    canManageAdmins: isAdmin
  }
}
