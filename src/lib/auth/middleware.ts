import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { 
  SecureLogger, 
  RateLimiter, 
  CSRFProtection, 
  SessionManager,
  type SecurityConfig 
} from './security'
import { env } from '@/lib/env'
import { withTimeout } from '@/lib/timeout'

// Middleware configuration
export interface MiddlewareConfig {
  security: Partial<SecurityConfig>
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
  features: {
    rateLimiting: boolean
    csrfProtection: boolean
    maintenanceMode: boolean
    securityHeaders: boolean
    logging: boolean
  }
}

const DEFAULT_CONFIG: MiddlewareConfig = {
  security: {
    rateLimiting: {
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
    },
    session: {
      maxAge: 24 * 60 * 60, // 24 hours
      refreshThreshold: 15 * 60, // 15 minutes
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    },
    logging: {
      level: process.env.NODE_ENV === 'production' ? 'minimal' : 'standard',
      includeIPs: process.env.NODE_ENV !== 'production',
      includeSensitiveData: false,
    },
  },
  routes: {
    protected: ['/bookmarks', '/profile', '/orders'],
    adminOnly: ['/admin'],
    publicOnly: ['/login', '/register', '/forgot-password'],
    apiRoutes: ['/api'],
  },
  redirects: {
    login: '/login',
    logout: '/',
    unauthorized: '/',
    maintenance: '/maintenance',
  },
  features: {
    rateLimiting: true,
    csrfProtection: true,
    maintenanceMode: false,
    securityHeaders: true,
    logging: true,
  },
}

/**
 * Enhanced middleware class with comprehensive security features
 */
export class AuthMiddleware {
  private config: MiddlewareConfig
  private logger: SecureLogger
  private rateLimiter: RateLimiter
  private csrfProtection: CSRFProtection
  private sessionManager: SessionManager

  constructor(config: Partial<MiddlewareConfig> = {}) {
    this.config = this.mergeConfig(config)
    this.logger = new SecureLogger(this.config.security.logging)
    this.rateLimiter = new RateLimiter(this.config.security.rateLimiting, this.logger)
    this.csrfProtection = new CSRFProtection(this.logger)
    this.sessionManager = new SessionManager(this.config.security.session, this.logger)
  }

  private mergeConfig(config: Partial<MiddlewareConfig>): MiddlewareConfig {
    return {
      security: { ...DEFAULT_CONFIG.security, ...config.security },
      routes: { ...DEFAULT_CONFIG.routes, ...config.routes },
      redirects: { ...DEFAULT_CONFIG.redirects, ...config.redirects },
      features: { ...DEFAULT_CONFIG.features, ...config.features },
    }
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const real = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    return real || 'unknown'
  }

  private addSecurityHeaders(response: NextResponse): NextResponse {
    if (!this.config.features.securityHeaders) return response

    // Security headers for production
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    // CSP header (customize based on your needs)
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
    )
    
    // HSTS header for HTTPS
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }

    return response
  }

  private async createSupabaseClient(request: NextRequest) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Validate environment variables
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      this.logger.error('Missing Supabase credentials', { 
        hasUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
      })
      throw new Error('Supabase configuration missing')
    }

    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, {
                ...options,
                // Ensure secure cookie settings
                httpOnly: options.httpOnly ?? true,
                secure: options.secure ?? true, // Always secure in production
                sameSite: options.sameSite ?? 'lax',
              })
            )
          },
        },
      }
    )

    return { supabase, response }
  }

  private matchesRoute(pathname: string, routes: string[]): boolean {
    return routes.some(route => pathname.startsWith(route))
  }

  private async checkRateLimit(request: NextRequest): Promise<boolean> {
    if (!this.config.features.rateLimiting) return true

    const clientIP = this.getClientIP(request)
    const identifier = `ip:${clientIP}`

    return this.rateLimiter.checkLimit(identifier, request)
  }

  private async validateCSRF(request: NextRequest, userId?: string): Promise<boolean> {
    if (!this.config.features.csrfProtection) return true
    
    // Only check CSRF for state-changing methods
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      return true
    }

    return await this.csrfProtection.validateRequest(request, userId)
  }

  private async getAuthState(supabase: ReturnType<typeof createServerClient>, request: NextRequest) {
    try {
      // Get session with enhanced error handling and timeout (10s)
      const { data: { session }, error: sessionError } = await withTimeout(
        supabase.auth.getSession(),
        10000,
        'Get session'
      )
      
      if (sessionError) {
        this.logger.warn('Session error in middleware', { error: sessionError.message, code: sessionError.status }, request)
        
        // Handle specific token errors gracefully
        if (sessionError.message.includes('refresh_token_not_found') || 
            sessionError.message.includes('Invalid Refresh Token') ||
            sessionError.message.includes('Refresh Token Not Found')) {
          return { user: null, session: null, error: 'token_expired' }
        }
        
        return { user: null, session: null, error: sessionError.message }
      }

      if (!session?.user) {
        return { user: null, session: null, error: null }
      }

      // Validate session age and refresh if needed
      const sessionValidation = await this.sessionManager.validateSession(undefined, true)
      
      if (!sessionValidation.isValid) {
        this.logger.info('Invalid session detected in middleware', { 
          reason: sessionValidation.reason,
          userId: session.user.id 
        }, request)
        
        if (sessionValidation.reason === 'expired') {
          // Try to refresh the session
          const refreshResult = await this.sessionManager.refreshSessionIfNeeded(true)
          
          if (refreshResult.isValid && refreshResult.session) {
            return { user: refreshResult.session.user, session: refreshResult.session, error: null }
          }
        }
        
        return { user: null, session: null, error: sessionValidation.reason }
      }

      return { user: session.user, session, error: null }
      
    } catch (error) {
      this.logger.error('Auth state check failed in middleware', error, request)
      return { user: null, session: null, error: 'auth_check_failed' }
    }
  }

  private async checkAdminStatus(supabase: ReturnType<typeof createServerClient>, userId: string, request: NextRequest): Promise<{
    isAdmin: boolean
    isMasterAdmin: boolean
    error?: string
  }> {
    const checkStartTime = Date.now()
    this.logger.info('🔐 [MIDDLEWARE] Starting admin status check', { 
      userId,
      pathname: request.nextUrl.pathname
    }, request)

    try {
      // First verify we have a valid session
      this.logger.info('📋 [MIDDLEWARE] Verifying session...', { userId }, request)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session || session.user.id !== userId) {
        this.logger.warn('❌ [MIDDLEWARE] Invalid session during admin check', { 
          error: sessionError?.message,
          hasSession: !!session,
          sessionUserId: session?.user?.id,
          requestedUserId: userId,
          sessionMatch: session?.user?.id === userId,
          duration: `${Date.now() - checkStartTime}ms`
        }, request)
        return { isAdmin: false, isMasterAdmin: false, error: 'invalid_session' }
      }

      this.logger.info('✅ [MIDDLEWARE] Session verified', { 
        userId,
        email: session.user.email,
        expiresAt: session.expires_at
      }, request)

      // Check admin status with retries
      let adminResult = null
      let adminError = null
      
      this.logger.info('🔍 [MIDDLEWARE] Calling is_admin() RPC with retries...', { userId }, request)
      
      for (let attempt = 0; attempt < 2; attempt++) { // Reduced to 2 attempts
        const attemptStart = Date.now()
        this.logger.info(`🔄 [MIDDLEWARE] Admin check attempt ${attempt + 1}/2`, { userId }, request)
        
        try {
          // Create timeout promise race
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Admin check timed out after 5s')), 5000)
          })
          
          const rpcPromise = supabase.rpc('is_admin')
          const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as Awaited<typeof rpcPromise>
          
          adminResult = data
          adminError = error
          
          if (!error) {
            this.logger.info(`✅ [MIDDLEWARE] Admin check successful on attempt ${attempt + 1}`, { 
              userId,
              isAdmin: Boolean(data),
              rawResult: data,
              attemptDuration: `${Date.now() - attemptStart}ms`,
              totalDuration: `${Date.now() - checkStartTime}ms`
            }, request)
            break
          }
          
          this.logger.warn(`⚠️ [MIDDLEWARE] Admin check attempt ${attempt + 1} failed`, { 
            attempt: attempt + 1,
            error: error.message,
            code: error.code,
            hint: error.hint,
            attemptDuration: `${Date.now() - attemptStart}ms`
          }, request)
        } catch (error) {
          this.logger.error(`💥 [MIDDLEWARE] Admin check attempt ${attempt + 1} threw exception`, error, request)
          adminError = error instanceof Error ? { message: error.message, code: 'exception' } : { message: 'Unknown error', code: 'exception' }
        }
        
        if (attempt < 1) { // Only 1 retry
          const waitTime = 1000 // Fixed 1s delay
          this.logger.info(`⏳ [MIDDLEWARE] Waiting ${waitTime}ms before retry...`, { userId }, request)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
      
      if (adminError) {
        this.logger.error('💥 [MIDDLEWARE] All admin check attempts FAILED', { 
          error: adminError.message,
          code: adminError.code,
          hint: adminError.hint,
          details: adminError.details,
          userId,
          totalDuration: `${Date.now() - checkStartTime}ms`
        }, request)
        
        // For authentication-related errors, treat as not admin
        if (adminError.message?.includes('permission') || 
            adminError.message?.includes('not authenticated') ||
            adminError.message?.includes('JWT')) {
          this.logger.warn('🔒 [MIDDLEWARE] Auth-related error - returning not admin', { userId }, request)
          return { isAdmin: false, isMasterAdmin: false, error: 'auth_required' }
        }
        
        return { isAdmin: false, isMasterAdmin: false, error: adminError.message }
      }
      
      const isAdmin = Boolean(adminResult)
      this.logger.info('✅ [MIDDLEWARE] Admin status determined', { 
        userId,
        isAdmin,
        rawResult: adminResult
      }, request)
      
      let isMasterAdmin = false
      
      // Check master admin status if user is admin
      if (isAdmin) {
        this.logger.info('👑 [MIDDLEWARE] User is admin, checking master admin status...', { userId }, request)
        
        try {
          const masterStart = Date.now()
          const { data: masterResult, error: masterError } = await supabase.rpc('is_master_admin')
          
          if (!masterError) {
            isMasterAdmin = Boolean(masterResult)
            this.logger.info('✅ [MIDDLEWARE] Master admin check successful', { 
              userId,
              isMasterAdmin,
              rawResult: masterResult,
              duration: `${Date.now() - masterStart}ms`
            }, request)
          } else {
            this.logger.warn('⚠️ [MIDDLEWARE] Master admin check failed', { 
              error: masterError.message,
              code: masterError.code,
              userId,
              duration: `${Date.now() - masterStart}ms`
            }, request)
          }
        } catch (masterError) {
          this.logger.error('💥 [MIDDLEWARE] Master admin check error', {
            error: masterError instanceof Error ? masterError.message : 'Unknown error',
            userId
          }, request)
        }
      } else {
        this.logger.info('⏭️ [MIDDLEWARE] User is NOT admin, skipping master admin check', { userId }, request)
      }
      
      const totalDuration = Date.now() - checkStartTime
      this.logger.info('✅ [MIDDLEWARE] Admin status check COMPLETE', { 
        userId,
        isAdmin,
        isMasterAdmin,
        totalDuration: `${totalDuration}ms`,
        pathname: request.nextUrl.pathname
      }, request)
      
      return { isAdmin, isMasterAdmin }
      
    } catch (error) {
      this.logger.error('Admin status check error in middleware', error, request)
      return { isAdmin: false, isMasterAdmin: false, error: 'admin_check_failed' }
    }
  }

  async handle(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now()
    const pathname = request.nextUrl.pathname
    const clientIP = this.getClientIP(request)
    
    // Initialize response
    let response = NextResponse.next({ request })
    
    try {
      // Add security headers
      response = this.addSecurityHeaders(response)
      
      // Check maintenance mode
      if (this.config.features.maintenanceMode && 
          !pathname.startsWith('/maintenance') &&
          !pathname.startsWith('/_next')) {
        this.logger.info('Maintenance mode redirect', { pathname }, request)
        return NextResponse.redirect(new URL(this.config.redirects.maintenance, request.url))
      }
      
      // Rate limiting check
      if (!await this.checkRateLimit(request)) {
        this.logger.security({
          type: 'RATE_LIMIT',
          ip: clientIP,
          userAgent: request.headers.get('user-agent') || 'unknown',
          details: { pathname, clientIP }
        }, request)
        
        return new NextResponse('Too Many Requests', { status: 429 })
      }

      // Create Supabase client
      const { supabase, response: supabaseResponse } = await this.createSupabaseClient(request)
      response = supabaseResponse

      // Get authentication state
      const authState = await this.getAuthState(supabase, request)
      const { user, session, error: authError } = authState
      
      // Log authentication state (minimal in production)
      if (this.config.features.logging) {
        this.logger.info('Middleware auth check', {
          pathname,
          hasUser: !!user,
          hasSession: !!session,
          authError,
        }, request)
      }

      // Handle authentication errors that require logout
      if (authError === 'token_expired' || authError === 'expired') {
        // Clear potentially stale session
        if (user) {
          try {
            await supabase.auth.signOut()
          } catch (signOutError) {
            this.logger.error('Failed to sign out expired session', signOutError, request)
          }
        }
      }

      // CSRF validation for authenticated requests
      if (user && !await this.validateCSRF(request, user.id)) {
        this.logger.security({
          type: 'CSRF_VIOLATION',
          ip: clientIP,
          userAgent: request.headers.get('user-agent') || 'unknown',
          details: { pathname, userId: user.id }
        }, request)
        
        return new NextResponse('Forbidden', { status: 403 })
      }

      // Route-based access control
      if (this.matchesRoute(pathname, this.config.routes.adminOnly)) {
        if (!user) {
          const loginUrl = new URL(this.config.redirects.login, request.url)
          loginUrl.searchParams.set('redirect', pathname)
          return NextResponse.redirect(loginUrl)
        }

        const adminStatus = await this.checkAdminStatus(supabase, user.id, request)
        
        if (adminStatus.error === 'auth_required') {
          const loginUrl = new URL(this.config.redirects.login, request.url)
          loginUrl.searchParams.set('redirect', pathname)
          return NextResponse.redirect(loginUrl)
        }
        
        if (!adminStatus.isAdmin) {
          this.logger.warn('Non-admin user attempted admin access', { 
            userId: user.id,
            pathname 
          }, request)
          return NextResponse.redirect(new URL(this.config.redirects.unauthorized, request.url))
        }
        
        this.logger.info('Admin access granted', {
          userId: user.id,
          isMasterAdmin: adminStatus.isMasterAdmin,
          pathname
        }, request)
      }

      // Protected routes
      if (this.matchesRoute(pathname, this.config.routes.protected) && !user) {
        const loginUrl = new URL(this.config.redirects.login, request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Public-only routes (redirect authenticated users)
      if (this.matchesRoute(pathname, this.config.routes.publicOnly) && user) {
        return NextResponse.redirect(new URL(this.config.redirects.logout, request.url))
      }

      // Log request completion
      if (this.config.features.logging && this.config.security.logging?.level !== 'minimal') {
        const duration = Date.now() - startTime
        this.logger.info('Middleware completed', {
          pathname,
          duration: `${duration}ms`,
          statusCode: response.status,
        }, request)
      }

      return response

    } catch (error) {
      this.logger.error('Middleware error', error, request)
      
      // Return a safe response even on errors
      return this.addSecurityHeaders(NextResponse.next({ request }))
    }
  }
}

// Export default middleware instance
export const authMiddleware = new AuthMiddleware()

/**
 * Enhanced middleware function that can be used directly in middleware.ts
 */
export async function enhancedAuthMiddleware(
  request: NextRequest,
  config?: Partial<MiddlewareConfig>
): Promise<NextResponse> {
  const middleware = config ? new AuthMiddleware(config) : authMiddleware
  return await middleware.handle(request)
}

// Middleware configuration builder
export class MiddlewareConfigBuilder {
  private config: Partial<MiddlewareConfig> = {}

  withSecurity(security: Partial<SecurityConfig>) {
    this.config.security = { ...this.config.security, ...security }
    return this
  }

  withRoutes(routes: Partial<MiddlewareConfig['routes']>) {
    this.config.routes = { ...this.config.routes, ...routes } as MiddlewareConfig['routes']
    return this
  }

  withRedirects(redirects: Partial<MiddlewareConfig['redirects']>) {
    this.config.redirects = { ...this.config.redirects, ...redirects } as MiddlewareConfig['redirects']
    return this
  }

  withFeatures(features: Partial<MiddlewareConfig['features']>) {
    this.config.features = { ...this.config.features, ...features } as MiddlewareConfig['features']
    return this
  }

  enableMaintenanceMode() {
    if (!this.config.features) this.config.features = {} as MiddlewareConfig['features']
    this.config.features.maintenanceMode = true
    return this
  }

  disableRateLimiting() {
    if (!this.config.features) this.config.features = {} as MiddlewareConfig['features']
    this.config.features.rateLimiting = false
    return this
  }

  enableDetailedLogging() {
    if (!this.config.security) this.config.security = {} as Partial<SecurityConfig>
    if (!this.config.security.logging) this.config.security.logging = {} as SecurityConfig['logging']
    this.config.security.logging.level = 'detailed'
    this.config.security.logging.includeIPs = true
    return this
  }

  build(): MiddlewareConfig {
    return {
      ...DEFAULT_CONFIG,
      ...this.config,
      security: { ...DEFAULT_CONFIG.security, ...this.config.security },
      routes: { ...DEFAULT_CONFIG.routes, ...this.config.routes },
      redirects: { ...DEFAULT_CONFIG.redirects, ...this.config.redirects },
      features: { ...DEFAULT_CONFIG.features, ...this.config.features },
    }
  }
}

// Export configuration builder
export const createMiddlewareConfig = () => new MiddlewareConfigBuilder()
