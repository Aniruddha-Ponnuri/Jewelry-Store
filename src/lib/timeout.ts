/**
 * Timeout Utilities
 * Provides timeout protection for async operations to prevent hanging requests
 */

export class TimeoutError extends Error {
  constructor(message: string, public readonly operation: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

/**
 * Wraps a promise with a timeout
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param operation - Description of the operation for error messages
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation = 'Operation'
): Promise<T> {
  let timeoutId: NodeJS.Timeout

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(`${operation} timed out after ${timeoutMs}ms`, operation))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId!)
    return result
  } catch (error) {
    clearTimeout(timeoutId!)
    throw error
  }
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  timeoutMs?: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  timeoutMs: 10000,
}

/**
 * Retry an operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  operationName = 'Operation'
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error | undefined
  let delay = fullConfig.initialDelayMs

  for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
    try {
      const promise = operation()
      
      if (fullConfig.timeoutMs) {
        return await withTimeout(
          promise,
          fullConfig.timeoutMs,
          `${operationName} (attempt ${attempt}/${fullConfig.maxAttempts})`
        )
      }
      
      return await promise
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === fullConfig.maxAttempts) {
        break
      }

      console.warn(
        `${operationName} attempt ${attempt}/${fullConfig.maxAttempts} failed:`,
        lastError.message,
        `Retrying in ${delay}ms...`
      )

      await new Promise(resolve => setTimeout(resolve, delay))
      delay = Math.min(delay * fullConfig.backoffMultiplier, fullConfig.maxDelayMs)
    }
  }

  throw lastError || new Error(`${operationName} failed after ${fullConfig.maxAttempts} attempts`)
}

/**
 * Configuration for Supabase operations
 */
export const SUPABASE_TIMEOUTS = {
  query: 10000,        // 10s for standard queries
  mutation: 15000,     // 15s for inserts/updates/deletes
  rpc: 10000,          // 10s for RPC calls
  auth: 10000,         // 10s for auth operations
  upload: 30000,       // 30s for file uploads
  healthCheck: 5000,   // 5s for health checks
} as const

/**
 * Configuration for API routes
 */
export const API_TIMEOUTS = {
  fast: 5000,          // 5s for fast endpoints
  standard: 10000,     // 10s for standard endpoints
  slow: 30000,         // 30s for slow operations
  cron: 10000,         // 10s for cron jobs
} as const
