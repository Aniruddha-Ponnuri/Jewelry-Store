/**
 * Auth Middleware Exports
 * Main middleware is in /middleware.ts
 * This file provides backward compatibility exports
 */

import { NextResponse, type NextRequest } from 'next/server'

// Type exports for backward compatibility
export interface MiddlewareConfig {
  routes: {
    protected: string[]
    adminOnly: string[]
    publicOnly: string[]
    apiRoutes: string[]
  }
  redirects: {
    login: string
    logout: string
    unauthorized: string
    maintenance: string
  }
}

// Legacy class exports
export class AuthMiddleware {
  async handle(request: NextRequest): Promise<NextResponse> {
    return NextResponse.next({ request })
  }
}

export const authMiddlewareInstance = new AuthMiddleware()

export async function enhancedAuthMiddleware(request: NextRequest): Promise<NextResponse> {
  return NextResponse.next({ request })
}

export async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  return NextResponse.next({ request })
}

export class MiddlewareConfigBuilder {
  withRoutes() { return this }
  withRedirects() { return this }
  withSecurity() { return this }
  withFeatures() { return this }
  enableMaintenanceMode() { return this }
  disableRateLimiting() { return this }
  enableDetailedLogging() { return this }
  build() { return {} }
}

export const createMiddlewareConfig = () => new MiddlewareConfigBuilder()
