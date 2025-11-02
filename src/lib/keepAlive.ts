/**
 * Keep-Alive Service for Supabase Connection Management
 * 
 * This service maintains database connections by sending periodic pings
 * to prevent connection timeouts and keep the database warm.
 */

import { env } from '@/lib/env'

interface KeepAliveConfig {
  /** Interval in milliseconds between pings (default: 2 hours) */
  interval: number
  /** Enable/disable keep-alive functionality */
  enabled: boolean
  /** Maximum number of consecutive failures before stopping */
  maxFailures: number
  /** Minimum interval when page is in background (default: 10 minutes) */
  backgroundInterval: number
  /** Enable detailed logging */
  verbose: boolean
}

interface KeepAlivePingResult {
  success: boolean
  timestamp: string
  serverTime?: number
  message?: string
  error?: string
}

class KeepAliveService {
  private config: KeepAliveConfig
  private intervalId: NodeJS.Timeout | null = null
  private backgroundIntervalId: NodeJS.Timeout | null = null
  private failureCount = 0
  private isPageVisible = true
  private lastPingTime = 0
  private clientId: string

  constructor(config: Partial<KeepAliveConfig> = {}) {
    this.config = {
      interval: env.NEXT_PUBLIC_KEEP_ALIVE_INTERVAL,
      backgroundInterval: env.NEXT_PUBLIC_KEEP_ALIVE_BACKGROUND_INTERVAL,
      enabled: env.NEXT_PUBLIC_KEEP_ALIVE_ENABLED,
      maxFailures: 5,
      verbose: process.env.NODE_ENV === 'development',
      ...config
    }

    // Generate unique client ID
    this.clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.log('KeepAlive service initialized', {
      interval: `${this.config.interval / 1000 / 60} minutes`,
      backgroundInterval: `${this.config.backgroundInterval / 1000 / 60} minutes`,
      enabled: this.config.enabled
    })
  }

  /**
   * Start the keep-alive service
   */
  start(): void {
    if (!this.config.enabled) {
      this.log('KeepAlive service is disabled')
      return
    }

    if (this.intervalId) {
      this.log('KeepAlive service already running')
      return
    }

    // Set up visibility change listeners
    this.setupVisibilityHandlers()

    // Start with immediate ping, then schedule regular intervals
    this.ping().then(() => {
      this.scheduleNextPing()
    })

    this.log('KeepAlive service started')
  }

  /**
   * Stop the keep-alive service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    if (this.backgroundIntervalId) {
      clearInterval(this.backgroundIntervalId)
      this.backgroundIntervalId = null
    }

    // Remove event listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    }

    this.log('KeepAlive service stopped')
  }

  /**
   * Manually trigger a ping
   */
  async ping(): Promise<KeepAlivePingResult> {
    if (!this.config.enabled) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: 'Keep-alive service is disabled'
      }
    }

    try {
      const response = await fetch('/api/keep-alive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: this.clientId,
          source: 'keep-alive-service',
          pageVisible: this.isPageVisible,
          lastPing: this.lastPingTime
        })
      })

      const result: KeepAlivePingResult = await response.json()
      
      if (result.success) {
        this.failureCount = 0
        this.lastPingTime = Date.now()
        this.log('Ping successful', result)
      } else {
        this.handlePingFailure(result.error || 'Unknown error')
      }

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error'
      this.handlePingFailure(errorMessage)
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: errorMessage
      }
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      running: this.intervalId !== null,
      clientId: this.clientId,
      failureCount: this.failureCount,
      lastPingTime: this.lastPingTime,
      isPageVisible: this.isPageVisible,
      nextPingIn: this.getTimeUntilNextPing()
    }
  }

  private scheduleNextPing(): void {
    const interval = this.isPageVisible ? this.config.interval : this.config.backgroundInterval

    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    this.intervalId = setInterval(async () => {
      await this.ping()
    }, interval)

    this.log(`Next ping scheduled in ${interval / 1000 / 60} minutes`)
  }

  private handlePingFailure(error: string): void {
    this.failureCount++
    this.log(`Ping failed (${this.failureCount}/${this.config.maxFailures}):`, error)

    if (this.failureCount >= this.config.maxFailures) {
      this.log(`Maximum failures reached (${this.config.maxFailures}). Stopping keep-alive service.`)
      this.stop()
    }
  }

  private setupVisibilityHandlers(): void {
    if (typeof document === 'undefined') return

    this.handleVisibilityChange = this.handleVisibilityChange.bind(this)
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  }

  private handleVisibilityChange = (): void => {
    const wasVisible = this.isPageVisible
    this.isPageVisible = !document.hidden

    if (wasVisible !== this.isPageVisible) {
      this.log(`Page visibility changed: ${this.isPageVisible ? 'visible' : 'hidden'}`)
      
      // Reschedule with appropriate interval
      this.scheduleNextPing()

      // If page became visible and it's been a while, ping immediately
      if (this.isPageVisible && Date.now() - this.lastPingTime > this.config.backgroundInterval) {
        this.ping()
      }
    }
  }

  private getTimeUntilNextPing(): number {
    if (!this.lastPingTime) return 0
    
    const interval = this.isPageVisible ? this.config.interval : this.config.backgroundInterval
    const elapsed = Date.now() - this.lastPingTime
    return Math.max(0, interval - elapsed)
  }

  private log(message: string, data?: unknown): void {
    if (!this.config.verbose) return

    const timestamp = new Date().toISOString()
    if (data) {
      console.log(`[KeepAlive ${timestamp}] ${message}`, data)
    } else {
      console.log(`[KeepAlive ${timestamp}] ${message}`)
    }
  }
}

// Global instance
let globalKeepAlive: KeepAliveService | null = null

/**
 * Get or create the global keep-alive service instance
 */
export function getKeepAliveService(config?: Partial<KeepAliveConfig>): KeepAliveService {
  if (!globalKeepAlive) {
    globalKeepAlive = new KeepAliveService(config)
  }
  return globalKeepAlive
}

/**
 * Start keep-alive service with default configuration
 */
export function startKeepAlive(config?: Partial<KeepAliveConfig>): KeepAliveService {
  const service = getKeepAliveService(config)
  service.start()
  return service
}

/**
 * Stop keep-alive service
 */
export function stopKeepAlive(): void {
  if (globalKeepAlive) {
    globalKeepAlive.stop()
  }
}

/**
 * Manual ping function
 */
export async function pingDatabase(): Promise<KeepAlivePingResult> {
  const service = getKeepAliveService()
  return await service.ping()
}

// Configuration constants
export const KEEP_ALIVE_CONFIG = {
  DEFAULT_INTERVAL: 2 * 60 * 60 * 1000, // 2 hours
  DEFAULT_BACKGROUND_INTERVAL: 10 * 60 * 1000, // 10 minutes
  MAX_FAILURES: 5
} as const

export type { KeepAliveConfig, KeepAlivePingResult }
export { KeepAliveService }
