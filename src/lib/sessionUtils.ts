/**
 * Session utility functions for handling authentication issues
 */

export function clearInvalidSession() {
  if (typeof window !== 'undefined') {
    try {
      // Clear all Supabase auth-related localStorage entries
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log('Cleared invalid session key:', key)
      })
      
      return keysToRemove.length > 0
    } catch (error) {
      console.error('Error clearing session:', error)
      return false
    }
  }
  return false
}

export function hasValidSession(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const authToken = localStorage.getItem('sb-auth-token')
      if (!authToken) return false
      
      const tokenData = JSON.parse(authToken)
      if (!tokenData.access_token || !tokenData.refresh_token) return false
      
      // Check if token is expired
      const expiresAt = tokenData.expires_at
      if (expiresAt && new Date(expiresAt * 1000) < new Date()) {
        console.log('Session token expired')
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error checking session validity:', error)
      return false
    }
  }
  return false
}

export function logSessionDebugInfo() {
  if (typeof window !== 'undefined') {
    console.log('=== SESSION DEBUG INFO ===')
    
    const authKeys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-')) {
        authKeys.push(key)
      }
    }
    
    console.log('Auth-related localStorage keys:', authKeys)
    
    authKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key)
        if (value) {
          const parsed = JSON.parse(value)
          console.log(`${key}:`, {
            hasAccessToken: !!parsed.access_token,
            hasRefreshToken: !!parsed.refresh_token,
            expiresAt: parsed.expires_at ? new Date(parsed.expires_at * 1000).toISOString() : null,
            user: parsed.user?.email || 'No user'
          })
        }
      } catch {
        console.log(`${key}: Invalid JSON`)
      }
    })
    
    console.log('=== END SESSION DEBUG ===')
  }
}
