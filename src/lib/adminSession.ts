import { createClient } from '@/lib/supabase/client'

/**
 * Admin Session Management Utilities
 * Helps maintain admin state across page refreshes and navigation
 */

export interface AdminSessionCache {
  userId: string
  isAdmin: boolean
  timestamp: number
  sessionId?: string
}

const ADMIN_CACHE_KEY = 'admin_session_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached admin status if valid
 */
export function getCachedAdminStatus(userId: string): boolean | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = sessionStorage.getItem(ADMIN_CACHE_KEY)
    if (!cached) {
      console.log('📦 [CACHE] No admin cache found')
      return null
    }
    
    const adminCache: AdminSessionCache = JSON.parse(cached)
    
    // Check if cache is valid
    const now = Date.now()
    const isExpired = now - adminCache.timestamp > CACHE_DURATION
    const isWrongUser = adminCache.userId !== userId
    
    console.log('📦 [CACHE] Admin cache check:', {
      userId,
      cachedUserId: adminCache.userId,
      isExpired,
      isWrongUser,
      cacheAge: Math.round((now - adminCache.timestamp) / 1000) + 's',
      cachedStatus: adminCache.isAdmin
    })
    
    if (isExpired || isWrongUser) {
      console.log('📦 [CACHE] Admin cache invalid - removing')
      sessionStorage.removeItem(ADMIN_CACHE_KEY)
      return null
    }
    
    console.log('📦 [CACHE] Admin cache valid - using cached status:', adminCache.isAdmin)
    return adminCache.isAdmin
  } catch (error) {
    console.warn('📦 [CACHE] Error reading admin cache:', error)
    return null
  }
}

/**
 * Cache admin status for quick retrieval
 */
export function cacheAdminStatus(userId: string, isAdmin: boolean, sessionId?: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const adminCache: AdminSessionCache = {
      userId,
      isAdmin,
      timestamp: Date.now(),
      sessionId
    }
    
    console.log('📦 [CACHE] Caching admin status:', {
      userId,
      isAdmin,
      sessionId: sessionId ? 'present' : 'missing'
    })
    
    sessionStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(adminCache))
  } catch (error) {
    console.warn('📦 [CACHE] Error caching admin status:', error)
  }
}

/**
 * Clear cached admin status
 */
export function clearAdminCache(): void {
  if (typeof window === 'undefined') return
  
  try {
    console.log('📦 [CACHE] Clearing admin cache')
    sessionStorage.removeItem(ADMIN_CACHE_KEY)
  } catch (error) {
    console.warn('📦 [CACHE] Error clearing admin cache:', error)
  }
}

/**
 * Verify admin status with database and update cache
 */
export async function verifyAndCacheAdminStatus(userId: string): Promise<boolean> {
  const verifyStartTime = Date.now()
  console.log('🔍 [ADMIN SESSION VERIFY] Starting verification for user:', { userId, timestamp: new Date().toISOString() })
  
  try {
    const supabase = createClient()
    
    // First verify we have a valid session with retries
    let session = null
    let sessionError = null
    
    console.log('📋 [ADMIN SESSION VERIFY] Step 1: Verifying session with retries...')
    
    for (let attempt = 0; attempt < 3; attempt++) {
      const attemptStart = Date.now()
      console.log(`🔄 [ADMIN SESSION VERIFY] Session attempt ${attempt + 1}/3...`)
      
      const { data: { session: sessionData }, error: sessionErrorData } = await supabase.auth.getSession()
      session = sessionData
      sessionError = sessionErrorData
      
      if (!sessionError && session && session.user.id === userId) {
        console.log(`✅ [ADMIN SESSION VERIFY] Valid session found on attempt ${attempt + 1}:`, {
          userId: session.user.id,
          email: session.user.email,
          attemptDuration: `${Date.now() - attemptStart}ms`
        })
        break
      }
      
      console.warn(`⚠️ [ADMIN SESSION VERIFY] Session attempt ${attempt + 1} failed:`, {
        error: sessionErrorData?.message,
        hasSession: !!sessionData,
        sessionUserId: sessionData?.user?.id,
        requestedUserId: userId,
        matches: sessionData?.user?.id === userId,
        attemptDuration: `${Date.now() - attemptStart}ms`
      })
      
      if (attempt < 2) {
        const waitTime = 1000 * (attempt + 1)
        console.log(`⏳ [ADMIN SESSION VERIFY] Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
    
    if (sessionError || !session || session.user.id !== userId) {
      console.error('❌ [ADMIN SESSION VERIFY] Session verification FAILED after all attempts:', {
        sessionError: sessionError?.message,
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        requestedUserId: userId,
        totalDuration: `${Date.now() - verifyStartTime}ms`
      })
      clearAdminCache()
      return false
    }
    
    console.log('✅ [ADMIN SESSION VERIFY] Session verified successfully')
    
    // Check admin status with database with retries
    let adminCheck = null
    let adminError = null
    
    console.log('🔐 [ADMIN SESSION VERIFY] Step 2: Checking is_admin() RPC with retries...')
    
    for (let attempt = 0; attempt < 3; attempt++) {
      const attemptStart = Date.now()
      console.log(`🔄 [ADMIN SESSION VERIFY] Admin check attempt ${attempt + 1}/3...`)
      
      const { data: adminData, error: adminErrorData } = await supabase.rpc('is_admin')
      adminCheck = adminData
      adminError = adminErrorData
      
      if (!adminError) {
        console.log(`✅ [ADMIN SESSION VERIFY] Admin check successful on attempt ${attempt + 1}:`, {
          userId,
          isAdmin: Boolean(adminData),
          rawResult: adminData,
          attemptDuration: `${Date.now() - attemptStart}ms`
        })
        break
      }
      
      console.warn(`⚠️ [ADMIN SESSION VERIFY] Admin check attempt ${attempt + 1} failed:`, {
        error: adminErrorData?.message || 'Unknown error',
        code: adminErrorData?.code,
        hint: adminErrorData?.hint,
        attemptDuration: `${Date.now() - attemptStart}ms`
      })
      
      if (attempt < 2) {
        const waitTime = 500 * (attempt + 1)
        console.log(`⏳ [ADMIN SESSION VERIFY] Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
    
    if (adminError) {
      console.error('� [ADMIN SESSION VERIFY] Admin check FAILED after all attempts:', {
        error: adminError.message,
        code: adminError.code,
        hint: adminError.hint,
        userId,
        totalDuration: `${Date.now() - verifyStartTime}ms`
      })
      clearAdminCache()
      return false
    }
    
    const isAdmin = Boolean(adminCheck)
    const totalDuration = Date.now() - verifyStartTime
    
    console.log('✅ [ADMIN SESSION VERIFY] Verification COMPLETE:', {
      userId,
      email: session.user.email,
      isAdmin,
      rawResult: adminCheck,
      totalDuration: `${totalDuration}ms`,
      timestamp: new Date().toISOString()
    })
    
    console.log('💾 [ADMIN SESSION VERIFY] Caching admin status...')
    cacheAdminStatus(userId, isAdmin, session.access_token)
    console.log('✅ [ADMIN SESSION VERIFY] Admin status cached successfully')
    
    return isAdmin
    
  } catch (error) {
    const totalDuration = Date.now() - verifyStartTime
    console.error('💥 [ADMIN SESSION VERIFY] Unexpected error during verification:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      totalDuration: `${totalDuration}ms`
    })
    clearAdminCache()
    return false
  }
}

/**
 * Enhanced admin status check with caching and session validation
 */
export async function getAdminStatusWithCache(userId: string): Promise<boolean> {
  console.log('🔍 [ADMIN SESSION CACHE] Checking admin status with cache...', { 
    userId,
    timestamp: new Date().toISOString()
  })
  
  // First try cache
  const cached = getCachedAdminStatus(userId)
  if (cached !== null) {
    console.log('✅ [ADMIN SESSION CACHE] Using cached admin status:', {
      userId,
      isAdmin: cached,
      source: 'cache'
    })
    return cached
  }
  
  // If no cache, verify with database
  console.log('⚠️ [ADMIN SESSION CACHE] Cache miss - verifying with database...', { userId })
  const result = await verifyAndCacheAdminStatus(userId)
  console.log('✅ [ADMIN SESSION CACHE] Database verification complete:', {
    userId,
    isAdmin: result,
    source: 'database'
  })
  return result
}
