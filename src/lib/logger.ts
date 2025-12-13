/**
 * Production Logger for Vercel Deployment
 * Supports verbose logging with structured output for monitoring
 */

const isServer = typeof window === 'undefined'
const isProd = process.env.NODE_ENV === 'production'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogMeta {
  timestamp: string
  level: LogLevel
  context?: string
  duration?: number
  userId?: string
  [key: string]: unknown
}

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): LogMeta {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  }
}

function sanitizeForProd(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data

  const sanitized = { ...data as Record<string, unknown> }
  const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken', 'access_token', 'refresh_token', 'secret', 'key']

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]'
    }
  }

  return sanitized
}

export const logger = {
  /**
   * Debug logs - only in development
   */
  debug(message: string, data?: unknown) {
    if (!isProd) {
      console.log(`[DEBUG] ${message}`, data ?? '')
    }
  },

  /**
   * Info logs - always logged, structured for Vercel
   */
  info(message: string, data?: unknown) {
    const log = formatLog('info', message, sanitizeForProd(data) as Record<string, unknown>)
    if (isServer) {
      console.log(JSON.stringify(log))
    } else if (!isProd) {
      console.log(`[INFO] ${message}`, data ?? '')
    }
  },

  /**
   * Warning logs - always logged
   */
  warn(message: string, data?: unknown) {
    const log = formatLog('warn', message, sanitizeForProd(data) as Record<string, unknown>)
    if (isServer) {
      console.warn(JSON.stringify(log))
    } else {
      console.warn(`[WARN] ${message}`, data ?? '')
    }
  },

  /**
   * Error logs - always logged with stack traces
   */
  error(message: string, error?: unknown) {
    const errorData = error instanceof Error
      ? { errorMessage: error.message, stack: error.stack }
      : { errorMessage: String(error) }

    const log = formatLog('error', message, errorData)
    if (isServer) {
      console.error(JSON.stringify(log))
    } else {
      console.error(`[ERROR] ${message}`, error)
    }
  },

  /**
   * Auth-specific logging with context
   */
  auth(action: string, data?: Record<string, unknown>) {
    const log = formatLog('info', `[AUTH] ${action}`, {
      context: 'auth',
      ...sanitizeForProd(data) as Record<string, unknown>
    })
    if (isServer) {
      console.log(JSON.stringify(log))
    } else if (!isProd) {
      console.log(`[AUTH] ${action}`, data ?? '')
    }
  },

  /**
   * API request logging
   */
  api(method: string, path: string, data?: Record<string, unknown>) {
    const log = formatLog('info', `[API] ${method} ${path}`, {
      context: 'api',
      method,
      path,
      ...sanitizeForProd(data) as Record<string, unknown>
    })
    if (isServer) {
      console.log(JSON.stringify(log))
    } else if (!isProd) {
      console.log(`[API] ${method} ${path}`, data ?? '')
    }
  },

  /**
   * Performance logging
   */
  perf(label: string, startTime: number, meta?: Record<string, unknown>) {
    const duration = Date.now() - startTime
    const log = formatLog('info', `[PERF] ${label}`, {
      context: 'performance',
      duration,
      durationMs: `${duration}ms`,
      ...meta
    })
    if (isServer) {
      console.log(JSON.stringify(log))
    } else if (!isProd) {
      console.log(`[PERF] ${label}: ${duration}ms`)
    }
  },

  /**
   * Middleware logging
   */
  middleware(path: string, action: string, data?: Record<string, unknown>) {
    const log = formatLog('info', `[MIDDLEWARE] ${action}`, {
      context: 'middleware',
      path,
      ...sanitizeForProd(data) as Record<string, unknown>
    })
    if (isServer) {
      console.log(JSON.stringify(log))
    }
  }
}
