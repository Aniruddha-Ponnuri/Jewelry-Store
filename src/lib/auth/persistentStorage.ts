/**
 * Persistent Auth Storage with Inactivity Timeout
 * Optimized for performance with debounced activity tracking
 */

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const ACTIVITY_DEBOUNCE = 60 * 1000 // Update activity at most once per minute
const LAST_ACTIVITY_KEY = 'auth_last_activity'

interface AuthStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

class PersistentAuthStorage implements AuthStorage {
  private lastActivityUpdate = 0
  private checkInterval: ReturnType<typeof setInterval> | null = null
  private cleanupFn: (() => void) | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  private initialize(): void {
    // Debounced activity tracking
    const updateActivity = () => {
      const now = Date.now()
      if (now - this.lastActivityUpdate > ACTIVITY_DEBOUNCE) {
        this.lastActivityUpdate = now
        try {
          localStorage.setItem(LAST_ACTIVITY_KEY, now.toString())
        } catch {
          // Storage quota exceeded, ignore
        }
      }
    }

    // Only track meaningful user activity
    const events = ['click', 'keydown'] as const
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true })
    })

    // Check inactivity every 5 minutes
    this.checkInterval = setInterval(() => this.checkInactivity(), 5 * 60 * 1000)

    // Store cleanup function
    this.cleanupFn = () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })
      if (this.checkInterval) {
        clearInterval(this.checkInterval)
      }
    }

    // Initial activity update
    updateActivity()
  }

  private checkInactivity(): void {
    try {
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY)
      if (!lastActivity) return

      const inactiveTime = Date.now() - parseInt(lastActivity, 10)
      if (inactiveTime > INACTIVITY_TIMEOUT) {
        this.clearSession()
        window.location.href = '/login?reason=inactivity'
      }
    } catch {
      // Ignore storage errors
    }
  }

  private clearSession(): void {
    try {
      // Clear all auth-related storage
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch {
      // Ignore errors
    }
  }

  getItem(key: string): string | null {
    try {
      // Check if session expired due to inactivity
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY)
      if (lastActivity) {
        const inactiveTime = Date.now() - parseInt(lastActivity, 10)
        if (inactiveTime > INACTIVITY_TIMEOUT) {
          this.clearSession()
          return null
        }
      }
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
      // Update activity on session updates
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
    } catch {
      // Storage quota exceeded, try to clear old data
      this.clearSession()
      try {
        localStorage.setItem(key, value)
      } catch {
        // Still failing, ignore
      }
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // Ignore
    }
  }

  destroy(): void {
    if (this.cleanupFn) {
      this.cleanupFn()
      this.cleanupFn = null
    }
  }
}

// Singleton with lazy initialization
let storageInstance: PersistentAuthStorage | null = null

export function getPersistentStorage(): AuthStorage {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }
  }

  if (!storageInstance) {
    storageInstance = new PersistentAuthStorage()
  }

  return storageInstance
}

export function getTimeUntilExpiry(): number | null {
  try {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY)
    if (!lastActivity) return null

    const expiryTime = parseInt(lastActivity, 10) + INACTIVITY_TIMEOUT
    const remaining = expiryTime - Date.now()
    return remaining > 0 ? remaining : 0
  } catch {
    return null
  }
}

export function isSessionActive(): boolean {
  const remaining = getTimeUntilExpiry()
  return remaining !== null && remaining > 0
}
