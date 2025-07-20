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
  try {
    console.log('🔍 [VERIFY] Verifying admin status for user:', userId)
    const supabase = createClient()
    
    // First verify we have a valid session with retries
    let session = null
    let sessionError = null
    
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: { session: sessionData }, error: sessionErrorData } = await supabase.auth.getSession()
      session = sessionData
      sessionError = sessionErrorData
      
      if (!sessionError && session && session.user.id === userId) {
        break
      }
      
      if (attempt < 2) {
        console.log(`🔄 [VERIFY] Session attempt ${attempt + 1} failed, retrying...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    if (sessionError || !session || session.user.id !== userId) {
      console.log('❌ [VERIFY] Invalid or missing session after retries:', {
        sessionError: sessionError?.message,
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        requestedUserId: userId
      })
      clearAdminCache()
      return false
    }
    
    console.log('✅ [VERIFY] Valid session found, checking admin status...')
    
    // Check admin status with database with retries
    let adminCheck = null
    let adminError = null
    
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: adminData, error: adminErrorData } = await supabase.rpc('is_admin')
      adminCheck = adminData
      adminError = adminErrorData
      
      if (!adminError) {
        break
      }
      
      if (attempt < 2) {
        console.log(`🔄 [VERIFY] Admin check attempt ${attempt + 1} failed, retrying...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    if (adminError) {
      console.error('🚨 [VERIFY] Error verifying admin status after retries:', adminError.message)
      // Don't cache errors, but don't clear cache either in case it's temporary
      return false
    }
    
    const isAdmin = Boolean(adminCheck)
    
    console.log('🔍 [VERIFY] Admin status verified:', {
      userId,
      isAdmin,
      rawResult: adminCheck
    })
    
    // Always cache the result (even if false) to prevent unnecessary database calls
    cacheAdminStatus(userId, isAdmin, session.access_token)
    
    return isAdmin
  } catch (error) {
    console.error('💥 [VERIFY] Error in verifyAndCacheAdminStatus:', error)
    return false
  }
}

/**
 * Enhanced admin status check with caching and session validation
 */
export async function getAdminStatusWithCache(userId: string): Promise<boolean> {
  // First try cache
  const cached = getCachedAdminStatus(userId)
  if (cached !== null) {
    console.log('Using cached admin status:', cached)
    return cached
  }
  
  // If no cache, verify with database
  console.log('Cache miss, verifying admin status with database')
  return await verifyAndCacheAdminStatus(userId)
}
