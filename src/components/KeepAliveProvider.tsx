'use client'

/**
 * KeepAliveProvider Component
 * 
 * Provides Supabase keep-alive functionality throughout the application.
 * This component should be placed high in the component tree to ensure
 * database connections remain active.
 */

import { useEffect } from 'react'
import { useSimpleKeepAlive } from '@/hooks/useKeepAlive'
import { env } from '@/lib/env'

interface KeepAliveProviderProps {
  children: React.ReactNode
  /** Override default enabled state */
  enabled?: boolean
  /** Enable debug mode for development */
  debug?: boolean
}

export function KeepAliveProvider({ 
  children, 
  enabled = env.NEXT_PUBLIC_KEEP_ALIVE_ENABLED,
  debug = process.env.NODE_ENV === 'development'
}: KeepAliveProviderProps) {
  
  // Start the keep-alive service
  useSimpleKeepAlive(enabled)

  // Optional: Log when provider mounts in development
  useEffect(() => {
    if (debug && enabled) {
      console.log('🔄 KeepAlive provider mounted - Supabase connection monitoring started')
      console.log(`📊 Keep-alive configuration:`, {
        interval: `${env.NEXT_PUBLIC_KEEP_ALIVE_INTERVAL / 1000 / 60} minutes`,
        backgroundInterval: `${env.NEXT_PUBLIC_KEEP_ALIVE_BACKGROUND_INTERVAL / 1000 / 60} minutes`,
        enabled
      })
    } else if (debug && !enabled) {
      console.log('⏸️ KeepAlive provider mounted but service is disabled')
    }
  }, [debug, enabled])

  return <>{children}</>
}

/**
 * Debug version of KeepAliveProvider with detailed logging
 */
export function KeepAliveDebugProvider({ children }: { children: React.ReactNode }) {
  return (
    <KeepAliveProvider enabled={true} debug={true}>
      {children}
    </KeepAliveProvider>
  )
}
