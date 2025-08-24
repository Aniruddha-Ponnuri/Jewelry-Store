'use client'

import { createClient } from '@/lib/supabase/client'

/**
 * Production-safe admin validation with comprehensive logging
 */
export async function validateAdminStatus() {
  console.log('🔐 [ADMIN VALIDATION] Starting admin status validation...')
  
  try {
    const supabase = createClient()
    
    // Step 1: Check session
    console.log('🔐 [ADMIN VALIDATION] Step 1: Checking session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('🔐 [ADMIN VALIDATION] ❌ Session error:', sessionError.message)
      return {
        isValid: false,
        isAdmin: false,
        isMasterAdmin: false,
        error: `Session error: ${sessionError.message}`,
        details: { step: 'session_check', sessionError }
      }
    }
    
    if (!session) {
      console.log('🔐 [ADMIN VALIDATION] ❌ No session found')
      return {
        isValid: false,
        isAdmin: false,
        isMasterAdmin: false,
        error: 'No active session',
        details: { step: 'session_check', hasSession: false }
      }
    }
    
    console.log('🔐 [ADMIN VALIDATION] ✅ Session found:', {
      userId: session.user.id,
      email: session.user.email,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
    })
    
    // Step 2: Check admin status
    console.log('🔐 [ADMIN VALIDATION] Step 2: Checking admin status...')
    const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin')
    
    if (adminError) {
      console.error('🔐 [ADMIN VALIDATION] ❌ Admin check error:', adminError.message)
      return {
        isValid: true,
        isAdmin: false,
        isMasterAdmin: false,
        error: `Admin check failed: ${adminError.message}`,
        details: { step: 'admin_check', adminError, userId: session.user.id }
      }
    }
    
    const isAdmin = Boolean(isAdminResult)
    console.log('🔐 [ADMIN VALIDATION]', isAdmin ? '✅' : '❌', 'Admin status:', isAdmin)
    
    // Step 3: Check master admin status (only if user is admin)
    let isMasterAdmin = false
    let masterError = null
    if (isAdmin) {
      console.log('🔐 [ADMIN VALIDATION] Step 3: Checking master admin status...')
      const { data: isMasterResult, error: masterErrorResult } = await supabase.rpc('is_master_admin')
      masterError = masterErrorResult
      
      if (masterError) {
        console.error('🔐 [ADMIN VALIDATION] ❌ Master admin check error:', masterError.message)
      } else {
        isMasterAdmin = Boolean(isMasterResult)
        console.log('🔐 [ADMIN VALIDATION]', isMasterAdmin ? '✅' : '❌', 'Master admin status:', isMasterAdmin)
      }
    }
    
    // Step 4: Get admin record details
    console.log('🔐 [ADMIN VALIDATION] Step 4: Getting admin record details...')
    const { data: adminRecord, error: recordError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    
    if (recordError && recordError.code !== 'PGRST116') {
      console.warn('🔐 [ADMIN VALIDATION] ⚠️ Admin record error:', recordError.message)
    } else if (adminRecord) {
      console.log('🔐 [ADMIN VALIDATION] ✅ Admin record found:', {
        role: adminRecord.role,
        isActive: adminRecord.is_active,
        createdAt: adminRecord.created_at
      })
    } else {
      console.log('🔐 [ADMIN VALIDATION] ❌ No admin record found')
    }
    
    // Step 5: Environment validation
    console.log('🔐 [ADMIN VALIDATION] Step 5: Environment validation...')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔐 [ADMIN VALIDATION] Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      supabaseUrlDomain: supabaseUrl ? new URL(supabaseUrl).hostname : 'missing',
      hasSupabaseKey: !!supabaseKey,
      supabaseKeyPrefix: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'missing'
    })
    
    // Final validation result
    const result = {
      isValid: true,
      isAdmin,
      isMasterAdmin,
      user: {
        id: session.user.id,
        email: session.user.email
      },
      adminRecord: adminRecord || null,
      details: {
        step: 'complete',
        sessionValid: true,
        adminCheckPassed: !adminError,
        masterAdminCheckPassed: !masterError,
        hasAdminRecord: !!adminRecord
      }
    }
    
    console.log('🔐 [ADMIN VALIDATION] ✅ Validation complete:', result)
    return result
    
  } catch (error) {
    console.error('🔐 [ADMIN VALIDATION] ❌ Unexpected error during validation:', error)
    return {
      isValid: false,
      isAdmin: false,
      isMasterAdmin: false,
      error: `Validation failed: ${error}`,
      details: { step: 'exception', error }
    }
  }
}

/**
 * Quick admin check for production use
 */
export async function quickAdminCheck() {
  console.log('🔐 [QUICK CHECK] Performing quick admin check...')
  
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.log('🔐 [QUICK CHECK] ❌ No session')
      return { isLoggedIn: false, isAdmin: false }
    }
    
    const { data: isAdminResult } = await supabase.rpc('is_admin')
    const isAdmin = Boolean(isAdminResult)
    
    console.log('🔐 [QUICK CHECK] Result:', {
      userId: session.user.id,
      email: session.user.email,
      isAdmin
    })
    
    return {
      isLoggedIn: true,
      isAdmin,
      userId: session.user.id,
      email: session.user.email
    }
    
  } catch (error) {
    console.error('🔐 [QUICK CHECK] ❌ Error:', error)
    return { isLoggedIn: false, isAdmin: false, error }
  }
}

// Add to window for easy access in browser console
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).validateAdmin = validateAdminStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).quickAdminCheck = quickAdminCheck
}
