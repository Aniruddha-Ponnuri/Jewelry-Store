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
    if (!cached) return null
    
    const adminCache: AdminSessionCache = JSON.parse(cached)
    
    // Check if cache is valid
    const now = Date.now()
    const isExpired = now - adminCache.timestamp > CACHE_DURATION
    const isWrongUser = adminCache.userId !== userId
    
    if (isExpired || isWrongUser) {
      sessionStorage.removeItem(ADMIN_CACHE_KEY)
      return null
    }
    
    return adminCache.isAdmin
  } catch {
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
    
    sessionStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(adminCache))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear cached admin status
 */
export function clearAdminCache(): void {
  if (typeof window === 'undefined') return
  
  try {
    sessionStorage.removeItem(ADMIN_CACHE_KEY)
  } catch {
    // Ignore storage errors
  }
}

/**
 * Verify admin status with database and update cache
 */
export async function verifyAndCacheAdminStatus(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // First verify we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session || session.user.id !== userId) {
      console.log('Invalid or missing session during admin verification')
      clearAdminCache()
      return false
    }
    
    // Check admin status with database
    const { data: adminCheck, error } = await supabase.rpc('is_admin')
    
    if (error) {
      console.error('Error verifying admin status:', error)
      // Don't cache errors, but don't clear cache either in case it's temporary
      return false
    }
    
    const isAdmin = Boolean(adminCheck)
    
    // Always cache the result (even if false) to prevent unnecessary database calls
    cacheAdminStatus(userId, isAdmin, session.access_token)
    
    console.log('Admin status verified and cached:', { userId, isAdmin })
    return isAdmin
  } catch (error) {
    console.error('Error in verifyAndCacheAdminStatus:', error)
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
