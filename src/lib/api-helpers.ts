/**
 * Global error handler for API routes
 */

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export function handleAPIError(error: unknown) {
  console.error('[API Error]:', error)

  if (error instanceof APIError) {
    return {
      error: error.message,
      statusCode: error.statusCode,
      details: error.details,
    }
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      statusCode: 500,
    }
  }

  return {
    error: 'An unknown error occurred',
    statusCode: 500,
  }
}

/**
 * Validates required environment variables
 */
export function validateEnv(vars: string[]): boolean {
  const missing = vars.filter((v) => !process.env[v])
  
  if (missing.length > 0) {
    console.error('[ENV] Missing required environment variables:', missing)
    return false
  }
  
  return true
}

/**
 * Safely parse JSON with error handling
 */
export async function safeParseJSON<T>(request: Request): Promise<T | null> {
  try {
    const text = await request.text()
    if (!text) return null
    return JSON.parse(text) as T
  } catch (error) {
    console.error('[JSON Parse Error]:', error)
    return null
  }
}

/**
 * Create standardized API response
 */
export function createAPIResponse<T>(
  data: T,
  status = 200,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

/**
 * Create error response
 */
export function createErrorResponse(
  message: string,
  status = 500,
  details?: unknown
) {
  return createAPIResponse(
    {
      success: false,
      error: message,
      details: process.env.NODE_ENV === 'production' ? undefined : details,
      timestamp: new Date().toISOString(),
    },
    status
  )
}

/**
 * Async error wrapper for API routes
 */
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | Response> => {
    try {
      return await handler(...args)
    } catch (error) {
      const errorInfo = handleAPIError(error)
      return createErrorResponse(
        errorInfo.error,
        errorInfo.statusCode,
        errorInfo.details
      ) as R
    }
  }
}
