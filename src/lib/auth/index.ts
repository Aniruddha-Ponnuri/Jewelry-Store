/**
 * Production-Ready Authentication System
 * Main entry point for the enhanced authentication system
 */

// Core security utilities
export {
  SecureLogger,
  RateLimiter,
  CSRFProtection,
  SessionManager,
  InputValidator,
  secureLogger,
  rateLimiter,
  csrfProtection,
  sessionManager,
  inputValidator,
  DEFAULT_CONFIG as SecurityConfig
} from './security'

// Enhanced hooks
export {
  useSecureAuth,
  type SecureAuthState,
  type SecureAuthConfig
} from '../hooks/useSecureAuth'

// Middleware
export {
  AuthMiddleware,
  enhancedAuthMiddleware,
  createMiddlewareConfig,
  type MiddlewareConfig
} from './middleware'

// Server actions
export {
  secureLogin,
  secureRegister,
  secureLogout,
  securePasswordReset,
  generateCSRFToken,
  type AuthResult,
  type LoginData,
  type RegisterData
} from './actions'

// Testing utilities
export {
  AuthTestSuite,
  AuthIntegrationTester,
  AuthPerformanceTester,
  AuthTestUtils,
  createAuthTestSuite,
  createAuthIntegrationTester,
  createAuthPerformanceTester,
  type TestConfig,
  type AuthTestResult,
  type SecurityTestResult
} from './testing'

// Constants and configuration
export const AUTH_CONFIG = {
  // Session settings
  SESSION: {
    MAX_AGE: 24 * 60 * 60, // 24 hours
    REFRESH_THRESHOLD: 15 * 60, // 15 minutes
    REMEMBER_ME_DURATION: 30 * 24 * 60 * 60, // 30 days
  },

  // Rate limiting
  RATE_LIMIT: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    BLOCK_DURATION_MS: 30 * 60 * 1000, // 30 minutes
  },

  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
  },

  // Security headers
  SECURITY_HEADERS: {
    HSTS: 'max-age=31536000; includeSubDomains',
    CSP: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
    X_FRAME_OPTIONS: 'DENY',
    X_CONTENT_TYPE_OPTIONS: 'nosniff',
    REFERRER_POLICY: 'strict-origin-when-cross-origin',
    X_XSS_PROTECTION: '1; mode=block',
  },

  // Routes
  ROUTES: {
    LOGIN: '/login',
    LOGOUT: '/',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    ADMIN: '/admin',
    UNAUTHORIZED: '/',
    MAINTENANCE: '/maintenance',
  },
} as const

// Validation helpers
export const AuthValidation = {
  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  },

  /**
   * Validate password strength
   */
  isValidPassword: (password: string): { valid: boolean; reason?: string; strength: number } => {
    if (!password || password.length < AUTH_CONFIG.PASSWORD.MIN_LENGTH) {
      return { valid: false, reason: 'too_short', strength: 0 }
    }

    if (password.length > AUTH_CONFIG.PASSWORD.MAX_LENGTH) {
      return { valid: false, reason: 'too_long', strength: 0 }
    }

    let strength = 0
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++

    if (strength < 3) {
      return { valid: false, reason: 'weak_password', strength }
    }

    // Check for common passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', '123456789', '12345678']
    if (commonPasswords.includes(password.toLowerCase())) {
      return { valid: false, reason: 'common_password', strength: 1 }
    }

    return { valid: true, strength }
  },

  /**
   * Validate redirect URL for security
   */
  isValidRedirect: (url: string, baseUrl?: string): boolean => {
    if (!url || url === '/') return true

    try {
      const parsed = new URL(url, baseUrl || process.env.NEXT_PUBLIC_SITE_URL)
      const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL!)

      // Only allow same-origin redirects
      return parsed.origin === siteUrl.origin
    } catch {
      return false
    }
  },

  /**
   * Check if route requires authentication
   */
  requiresAuth: (pathname: string): boolean => {
    const protectedRoutes = ['/admin', '/profile', '/bookmarks', '/orders']
    return protectedRoutes.some(route => pathname.startsWith(route))
  },

  /**
   * Check if route requires admin privileges
   */
  requiresAdmin: (pathname: string): boolean => {
    return pathname.startsWith('/admin')
  },
}

// Auth state helpers
export const AuthHelpers = {
  /**
   * Get user display name
   */
  getDisplayName: (user: { user_metadata?: { full_name?: string }; email?: string } | null): string => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  },

  /**
   * Check if user has role
   */
  hasRole: (user: { app_metadata?: { role?: string; roles?: string[] } } | null, role: 'admin' | 'master_admin'): boolean => {
    return user?.app_metadata?.role === role || 
           user?.app_metadata?.roles?.includes(role) ||
           false
  },

  /**
   * Get user avatar URL
   */
  getAvatarUrl: (user: { user_metadata?: { avatar_url?: string; full_name?: string }; email?: string } | null): string => {
    return user?.user_metadata?.avatar_url || 
           `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(AuthHelpers.getDisplayName(user))}`
  },

  /**
   * Format session expiry
   */
  formatSessionExpiry: (expiresAt: number): string => {
    const now = Math.floor(Date.now() / 1000)
    const timeLeft = expiresAt - now
    
    if (timeLeft <= 0) return 'Expired'
    if (timeLeft < 60) return `${timeLeft}s`
    if (timeLeft < 3600) return `${Math.floor(timeLeft / 60)}m`
    
    return `${Math.floor(timeLeft / 3600)}h`
  },

  /**
   * Calculate security score
   */
  calculateSecurityScore: (user: { email_confirmed_at?: string } | null, session: { expires_at?: number } | null): number => {
    let score = 0

    // Base score for valid session
    if (session) score += 40

    // Email verification bonus
    if (user?.email_confirmed_at) score += 20

    // Admin verification bonus
    if (AuthHelpers.hasRole(user, 'admin')) score += 20

    // Session freshness bonus
    if (session?.expires_at) {
      const now = Math.floor(Date.now() / 1000)
      const expiresIn = session.expires_at - now
      if (expiresIn > 30 * 60) score += 20 // More than 30 minutes left
    }

    return Math.min(100, score)
  },
}

// Error messages
export const AuthErrors = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_NOT_FOUND: 'No account found with this email address',
  ACCOUNT_DISABLED: 'This account has been disabled',
  EMAIL_NOT_CONFIRMED: 'Please check your email and click the verification link',
  PASSWORD_TOO_WEAK: 'Password does not meet security requirements',
  EMAIL_INVALID: 'Please enter a valid email address',
  RATE_LIMITED: 'Too many attempts. Please wait before trying again',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again',
  CSRF_INVALID: 'Security validation failed. Please refresh and try again',
  SERVER_ERROR: 'An unexpected error occurred. Please try again',
  ADMIN_REQUIRED: 'Admin privileges required to access this resource',
  UNAUTHORIZED: 'You are not authorized to perform this action',
} as const

// Success messages
export const AuthMessages = {
  LOGIN_SUCCESS: 'Welcome back!',
  LOGOUT_SUCCESS: 'You have been signed out successfully',
  REGISTER_SUCCESS: 'Account created successfully',
  REGISTER_VERIFICATION: 'Please check your email to verify your account',
  PASSWORD_RESET_SENT: 'Password reset instructions have been sent to your email',
  PASSWORD_UPDATED: 'Your password has been updated successfully',
  PROFILE_UPDATED: 'Your profile has been updated',
  EMAIL_VERIFIED: 'Your email has been verified successfully',
} as const

// Development utilities
export const AuthDev = {
  /**
   * Run security audit (development only)
   */
  runSecurityAudit: async () => {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Security audit should not be run in production')
      return null
    }

    const testSuite = createAuthTestSuite()
    const results = await testSuite.runSecurityTestSuite()
    
    console.group('🔒 Authentication Security Audit')
    console.log(AuthTestUtils.formatTestResults(results))
    console.groupEnd()
    
    return results
  },

  /**
   * Test performance (development only)
   */
  testPerformance: async (iterations: number = 10) => {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Performance testing should not be run in production')
      return null
    }

    const tester = createAuthPerformanceTester()
    const results = await tester.testAuthPerformance(iterations)
    
    console.group('⚡ Authentication Performance Test')
    console.table({
      'Average Response Time': `${results.averageResponseTime.toFixed(2)}ms`,
      'Min Response Time': `${results.minResponseTime}ms`,
      'Max Response Time': `${results.maxResponseTime}ms`,
      'Success Rate': `${results.successRate.toFixed(1)}%`
    })
    console.log('Recommendations:', results.recommendations)
    console.groupEnd()
    
    return results
  },

  /**
   * Generate test data (development only)
   */
  generateTestData: () => {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Test data generation should not be used in production')
      return null
    }

    return {
      users: Array.from({ length: 5 }, (_, i) => AuthTestUtils.generateTestUser(i + 1)),
      sessions: Array.from({ length: 3 }, (_, i) => AuthTestUtils.generateTestSession(`test-user-${i + 1}`)),
      requests: [
        AuthTestUtils.createTestRequest({ pathname: '/admin', method: 'GET' }),
        AuthTestUtils.createTestRequest({ pathname: '/login', method: 'POST' }),
        AuthTestUtils.createTestRequest({ pathname: '/api/auth/logout', method: 'POST' })
      ]
    }
  }
}

// Add global auth utilities to window in development
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).AuthDev = AuthDev
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).AuthValidation = AuthValidation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).AuthHelpers = AuthHelpers
}

// Types for external use
export type {
  SecurityConfig,
  AuthAttempt,
  SecurityViolation
} from './security'

export type {
  MiddlewareConfig
} from './middleware'

// Default export with commonly used utilities
const AuthSystem = {
  CONFIG: AUTH_CONFIG,
  Validation: AuthValidation,
  Helpers: AuthHelpers,
  Errors: AuthErrors,
  Messages: AuthMessages,
  Dev: AuthDev,
}

export default AuthSystem
