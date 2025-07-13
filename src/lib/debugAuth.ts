'use client'

import { createClient } from '@/lib/supabase/client'

export async function debugAuthStatus() {
  const supabase = createClient()
  
  console.log('=== AUTH DEBUG START ===')
  
  try {
    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session:', session?.user?.id ? 'Exists' : 'None', sessionError ? `Error: ${sessionError.message}` : 'No error')
    
    if (session?.user) {
      console.log('User ID:', session.user.id)
      console.log('User Email:', session.user.email)
      console.log('Session expires at:', session.expires_at)
      
      // Check admin status
      const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin')
      console.log('Admin Status:', isAdminData ? 'ADMIN' : 'NOT ADMIN', adminError ? `Error: ${adminError.message}` : 'No error')
      
      // Check master admin status
      const { data: isMasterAdminData, error: masterAdminError } = await supabase.rpc('is_master_admin')
      console.log('Master Admin Status:', isMasterAdminData ? 'MASTER ADMIN' : 'NOT MASTER ADMIN', masterAdminError ? `Error: ${masterAdminError.message}` : 'No error')
      
      // Get detailed debug info
      const { data: debugData, error: debugError } = await supabase.rpc('debug_admin_status')
      if (debugData && !debugError) {
        console.log('Debug Info:', {
          user_id: debugData.user_id,
          is_admin_function_result: debugData.is_admin_function_result,
          is_master_admin_function_result: debugData.is_master_admin_function_result,
          total_active_admins: debugData.total_active_admins,
          total_master_admins: debugData.total_master_admins,
          user_admin_record_exists: debugData.user_admin_record_exists,
          user_admin_is_active: debugData.user_admin_is_active,
          admin_role: debugData.admin_role,
          admin_email: debugData.admin_email
        })
      } else if (debugError) {
        console.log('Debug Error:', debugError.message)
      }
    }
    
    // Check cookies
    const allCookies = document.cookie.split(';').map(c => c.trim().split('=')[0])
    const authCookies = allCookies.filter(c => c.includes('supabase') || c.includes('sb-'))
    console.log('Auth Cookies:', authCookies.length > 0 ? authCookies : 'None found')
    
  } catch (error) {
    console.error('Debug Auth Error:', error)
  }
  
  console.log('=== AUTH DEBUG END ===')
}

// Add to window for easy access in browser console
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).debugAuth = debugAuthStatus
}
