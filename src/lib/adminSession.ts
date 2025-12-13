/**
 * Admin Session Management
 * Simplified caching layer for admin status
 */

import { createClient } from '@/lib/supabase/client'

interface AdminCache {
  userId: string
  isAdmin: boolean
  timestamp: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
let cache: AdminCache | null = null

export function getCachedAdminStatus(userId: string): boolean | null {
  if (!cache || cache.userId !== userId) return null
  if (Date.now() - cache.timestamp > CACHE_TTL) {
    cache = null
    return null
  }
  return cache.isAdmin
}

export function cacheAdminStatus(userId: string, isAdmin: boolean): void {
  cache = { userId, isAdmin, timestamp: Date.now() }
}

export function clearAdminCache(): void {
  cache = null
}

export async function getAdminStatusWithCache(userId: string): Promise<boolean> {
  const cached = getCachedAdminStatus(userId)
  if (cached !== null) return cached

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('is_admin')

    if (error) {
      return false
    }

    const isAdmin = Boolean(data)
    cacheAdminStatus(userId, isAdmin)
    return isAdmin
  } catch {
    return false
  }
}

export async function verifyAndCacheAdminStatus(userId: string): Promise<boolean> {
  return getAdminStatusWithCache(userId)
}
