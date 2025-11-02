import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * API route to check admin status
 * This provides a reliable server-side admin check
 */
export async function GET() {
  const startTime = Date.now()
  console.log('🔍 [API ADMIN STATUS] Starting admin status check...')
  
  try {
    const supabase = await createClient()
    
    // Get current session
    console.log('📋 [API ADMIN STATUS] Step 1: Getting session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('❌ [API ADMIN STATUS] Session error:', {
        error: sessionError?.message || 'No active session',
        hasSession: !!session,
        duration: `${Date.now() - startTime}ms`
      })
      return NextResponse.json({
        isAdmin: false,
        isMasterAdmin: false,
        authenticated: false,
        error: sessionError?.message || 'No active session'
      }, { status: 401 })
    }

    console.log('✅ [API ADMIN STATUS] Session found:', {
      userId: session.user.id,
      email: session.user.email,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
    })

    // Check admin status
    console.log('🔐 [API ADMIN STATUS] Step 2: Checking is_admin() RPC...')
    const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin')
    
    if (adminError) {
      console.error('❌ [API ADMIN STATUS] Admin check RPC error:', {
        error: adminError.message,
        code: adminError.code,
        hint: adminError.hint,
        details: adminError.details,
        userId: session.user.id,
        duration: `${Date.now() - startTime}ms`
      })
      return NextResponse.json({
        isAdmin: false,
        isMasterAdmin: false,
        authenticated: true,
        error: adminError.message
      }, { status: 200 })
    }

    const isAdmin = Boolean(isAdminData)
    console.log('✅ [API ADMIN STATUS] Admin check result:', {
      isAdmin,
      rawResult: isAdminData,
      userId: session.user.id,
      email: session.user.email
    })

    let isMasterAdmin = false

    // Check master admin status if user is admin
    if (isAdmin) {
      console.log('👑 [API ADMIN STATUS] Step 3: Checking is_master_admin() RPC...')
      const { data: masterData, error: masterError } = await supabase.rpc('is_master_admin')
      
      if (masterError) {
        console.error('⚠️ [API ADMIN STATUS] Master admin check error:', {
          error: masterError.message,
          userId: session.user.id
        })
      } else {
        isMasterAdmin = Boolean(masterData)
        console.log('✅ [API ADMIN STATUS] Master admin result:', {
          isMasterAdmin,
          rawResult: masterData,
          userId: session.user.id
        })
      }
    } else {
      console.log('⏭️ [API ADMIN STATUS] Skipping master admin check (user is not admin)')
    }

    const duration = Date.now() - startTime
    console.log('✅ [API ADMIN STATUS] Admin status check complete:', {
      isAdmin,
      isMasterAdmin,
      authenticated: true,
      userId: session.user.id,
      email: session.user.email,
      duration: `${duration}ms`
    })

    return NextResponse.json({
      isAdmin,
      isMasterAdmin,
      authenticated: true,
      userId: session.user.id,
      email: session.user.email,
      error: null
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('💥 [API ADMIN STATUS] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    })
    return NextResponse.json({
      isAdmin: false,
      isMasterAdmin: false,
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
