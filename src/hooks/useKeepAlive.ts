/**
 * useKeepAlive Hook
 * 
 * React hook that maintains Supabase database connections by sending
 * periodic pings to prevent connection timeouts.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { 
  startKeepAlive, 
  stopKeepAlive, 
  getKeepAliveService, 
  pingDatabase,
  type KeepAliveConfig, 
  type KeepAlivePingResult 
} from '@/lib/keepAlive'

interface UseKeepAliveOptions extends Partial<KeepAliveConfig> {
  /** Auto-start the service when component mounts */
  autoStart?: boolean
  /** Callback when ping succeeds */
  onPingSuccess?: (result: KeepAlivePingResult) => void
  /** Callback when ping fails */
  onPingFailure?: (error: string) => void
  /** Callback when service stops due to max failures */
  onServiceStop?: () => void
}

interface UseKeepAliveReturn {
  /** Whether the keep-alive service is currently running */
  isRunning: boolean
  /** Number of consecutive ping failures */
  failureCount: number
  /** Timestamp of last successful ping */
  lastPingTime: number
  /** Whether the current page/tab is visible */
  isPageVisible: boolean
  /** Unique client identifier */
  clientId: string
  /** Time in milliseconds until next ping */
  nextPingIn: number
  /** Manually start the keep-alive service */
  start: () => void
  /** Stop the keep-alive service */
  stop: () => void
  /** Manually trigger a ping */
  ping: () => Promise<KeepAlivePingResult>
  /** Get current service status */
  getStatus: () => ReturnType<typeof getKeepAliveService>['getStatus']
}

export function useKeepAlive(options: UseKeepAliveOptions = {}): UseKeepAliveReturn {
  const {
    autoStart = true,
    onPingSuccess,
    onPingFailure,
    onServiceStop,
    ...serviceConfig
  } = options

  const [status, setStatus] = useState(() => ({
    isRunning: false,
    failureCount: 0,
    lastPingTime: 0,
    isPageVisible: true,
    clientId: '',
    nextPingIn: 0
  }))

  const serviceRef = useRef<ReturnType<typeof getKeepAliveService> | null>(null)
  const statusInterval = useRef<NodeJS.Timeout | null>(null)

  // Initialize service
  useEffect(() => {
    serviceRef.current = getKeepAliveService(serviceConfig)
    
    // Update initial status
    const initialStatus = serviceRef.current.getStatus()
    setStatus({
      isRunning: initialStatus.running,
      failureCount: initialStatus.failureCount,
      lastPingTime: initialStatus.lastPingTime,
      isPageVisible: initialStatus.isPageVisible,
      clientId: initialStatus.clientId,
      nextPingIn: initialStatus.nextPingIn
    })

    return () => {
      if (statusInterval.current) {
        clearInterval(statusInterval.current)
      }
    }
  }, [])

  // Start service automatically if enabled
  useEffect(() => {
    if (autoStart && serviceRef.current) {
      serviceRef.current.start()
    }

    return () => {
      // Don't auto-stop on unmount - let the service continue running
      // Users can manually call stop() if needed
    }
  }, [autoStart])

  // Set up status polling
  useEffect(() => {
    if (!serviceRef.current) return

    // Update status every 30 seconds
    statusInterval.current = setInterval(() => {
      if (serviceRef.current) {
        const currentStatus = serviceRef.current.getStatus()
        setStatus({
          isRunning: currentStatus.running,
          failureCount: currentStatus.failureCount,
          lastPingTime: currentStatus.lastPingTime,
          isPageVisible: currentStatus.isPageVisible,
          clientId: currentStatus.clientId,
          nextPingIn: currentStatus.nextPingIn
        })
      }
    }, 30000) // Update every 30 seconds

    return () => {
      if (statusInterval.current) {
        clearInterval(statusInterval.current)
      }
    }
  }, [])

  // Callback handlers
  const handlePingSuccess = useCallback((result: KeepAlivePingResult) => {
    onPingSuccess?.(result)
  }, [onPingSuccess])

  const handlePingFailure = useCallback((error: string) => {
    onPingFailure?.(error)
  }, [onPingFailure])

  const handleServiceStop = useCallback(() => {
    onServiceStop?.()
  }, [onServiceStop])

  // API methods
  const start = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.start()
      
      // Update status immediately
      const newStatus = serviceRef.current.getStatus()
      setStatus(prev => ({
        ...prev,
        isRunning: newStatus.running
      }))
    }
  }, [])

  const stop = useCallback(() => {
    stopKeepAlive()
    
    // Update status immediately
    setStatus(prev => ({
      ...prev,
      isRunning: false
    }))
  }, [])

  const ping = useCallback(async (): Promise<KeepAlivePingResult> => {
    const result = await pingDatabase()
    
    if (result.success) {
      handlePingSuccess(result)
    } else {
      handlePingFailure(result.error || 'Unknown error')
    }
    
    return result
  }, [handlePingSuccess, handlePingFailure])

  const getStatus = useCallback(() => {
    return serviceRef.current?.getStatus() || {
      enabled: false,
      running: false,
      clientId: '',
      failureCount: 0,
      lastPingTime: 0,
      isPageVisible: true,
      nextPingIn: 0
    }
  }, [])

  return {
    isRunning: status.isRunning,
    failureCount: status.failureCount,
    lastPingTime: status.lastPingTime,
    isPageVisible: status.isPageVisible,
    clientId: status.clientId,
    nextPingIn: status.nextPingIn,
    start,
    stop,
    ping,
    getStatus
  }
}

/**
 * Simple hook that just starts keep-alive service with minimal configuration
 */
export function useSimpleKeepAlive(enabled: boolean = true): void {
  useKeepAlive({
    enabled,
    autoStart: enabled,
    verbose: process.env.NODE_ENV === 'development'
  })
}

/**
 * Hook for debugging keep-alive functionality
 */
export function useKeepAliveDebug() {
  const keepAlive = useKeepAlive({
    verbose: true,
    onPingSuccess: (result) => {
      console.log('🏓 Keep-alive ping successful:', result)
    },
    onPingFailure: (error) => {
      console.error('❌ Keep-alive ping failed:', error)
    },
    onServiceStop: () => {
      console.warn('⚠️ Keep-alive service stopped due to failures')
    }
  })

  return {
    ...keepAlive,
    // Additional debug methods
    debug: {
      forceStart: keepAlive.start,
      forceStop: keepAlive.stop,
      forcePing: keepAlive.ping,
      getFullStatus: keepAlive.getStatus
    }
  }
}
