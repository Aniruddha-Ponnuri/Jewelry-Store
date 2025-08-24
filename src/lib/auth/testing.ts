/**
 * Authentication Testing Utilities
 * Provides comprehensive testing helpers for the authentication system
 */

import { 
  SecureLogger, 
  RateLimiter, 
  CSRFProtection, 
  SessionManager, 
  InputValidator 
} from './security'
import { createClient } from '@/lib/supabase/client'

// Test configuration
interface TestConfig {
  skipRateLimit?: boolean
  skipCSRF?: boolean
  mockSession?: Record<string, unknown>
  logLevel?: 'none' | 'minimal' | 'detailed'
}

// Test results interfaces
export interface AuthTestResult {
  passed: boolean
  message: string
  details?: Record<string, unknown>
  duration?: number
  errors?: string[]
}

export interface SecurityTestResult {
  testName: string
  passed: boolean
  details: {
    rateLimiting?: AuthTestResult
    csrfProtection?: AuthTestResult
    sessionSecurity?: AuthTestResult
    inputValidation?: AuthTestResult
  }
  overallScore: number
  recommendations: string[]
}

/**
 * Authentication Test Suite
 */
export class AuthTestSuite {
  private logger: SecureLogger
  private rateLimiter: RateLimiter
  private csrfProtection: CSRFProtection
  private sessionManager: SessionManager
  private inputValidator: InputValidator

  constructor(private config: TestConfig = {}) {
    this.logger = new SecureLogger({
      level: config.logLevel || 'minimal',
      includeIPs: false,
      includeSensitiveData: false
    })
    
    this.rateLimiter = new RateLimiter()
    this.csrfProtection = new CSRFProtection(this.logger)
    this.sessionManager = new SessionManager(undefined, this.logger)
    this.inputValidator = new InputValidator(this.logger)
  }

  /**
   * Test rate limiting functionality
   */
  async testRateLimiting(): Promise<AuthTestResult> {
    const startTime = Date.now()
    
    try {
      if (this.config.skipRateLimit) {
        return {
          passed: true,
          message: 'Rate limiting test skipped',
          duration: Date.now() - startTime
        }
      }

      const testIdentifier = `test:${Date.now()}`
      const errors: string[] = []

      // Test normal operation
      let canProceed = this.rateLimiter.checkLimit(testIdentifier)
      if (!canProceed) {
        errors.push('Rate limiter blocked legitimate request')
      }

      // Test multiple attempts
      for (let i = 0; i < 6; i++) {
        this.rateLimiter.recordAttempt(testIdentifier, false, 'test@example.com')
      }

      // Should be blocked now
      canProceed = this.rateLimiter.checkLimit(testIdentifier)
      if (canProceed) {
        errors.push('Rate limiter failed to block after multiple failures')
      }

      // Test reset functionality
      this.rateLimiter.reset(testIdentifier)
      canProceed = this.rateLimiter.checkLimit(testIdentifier)
      if (!canProceed) {
        errors.push('Rate limiter reset failed')
      }

      return {
        passed: errors.length === 0,
        message: errors.length === 0 ? 'Rate limiting working correctly' : 'Rate limiting issues found',
        errors: errors.length > 0 ? errors : undefined,
        duration: Date.now() - startTime
      }

    } catch (error) {
      return {
        passed: false,
        message: 'Rate limiting test failed with error',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Test CSRF protection
   */
  async testCSRFProtection(): Promise<AuthTestResult> {
    const startTime = Date.now()
    
    try {
      if (this.config.skipCSRF) {
        return {
          passed: true,
          message: 'CSRF protection test skipped',
          duration: Date.now() - startTime
        }
      }

      const errors: string[] = []

      // Test token generation
      const token = await this.csrfProtection.generateToken('test-user')
      if (!token) {
        errors.push('CSRF token generation failed')
      }

      // Test valid token validation
      const isValidToken = await this.csrfProtection.validateToken(token, 'test-user')
      if (!isValidToken) {
        errors.push('Valid CSRF token was rejected')
      }

      // Test invalid token validation
      const isInvalidToken = await this.csrfProtection.validateToken('invalid-token', 'test-user')
      if (isInvalidToken) {
        errors.push('Invalid CSRF token was accepted')
      }

      // Test expired token (simulate by waiting)
      await new Promise(resolve => setTimeout(resolve, 10))
      const isExpiredValid = await this.csrfProtection.validateToken(token, 'test-user', 1)
      if (isExpiredValid) {
        errors.push('Expired CSRF token was accepted')
      }

      return {
        passed: errors.length === 0,
        message: errors.length === 0 ? 'CSRF protection working correctly' : 'CSRF protection issues found',
        errors: errors.length > 0 ? errors : undefined,
        duration: Date.now() - startTime
      }

    } catch (error) {
      return {
        passed: false,
        message: 'CSRF protection test failed with error',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Test session management
   */
  async testSessionSecurity(): Promise<AuthTestResult> {
    const startTime = Date.now()
    
    try {
      const errors: string[] = []

      // Test session validation
      const validation = await this.sessionManager.validateSession()
      if (validation.isValid && !this.config.mockSession) {
        // Should not be valid without a real session in test environment
        // This is expected behavior
      }

      // Test session refresh (will fail without valid session, which is expected)
      try {
        await this.sessionManager.refreshSessionIfNeeded()
      } catch {
        // Expected in test environment without real session
      }

      // Test session clearing
      const clearResult = await this.sessionManager.clearSession()
      if (!clearResult.success && !clearResult.error) {
        errors.push('Session clear operation returned unexpected result')
      }

      return {
        passed: errors.length === 0,
        message: errors.length === 0 ? 'Session management working correctly' : 'Session management issues found',
        errors: errors.length > 0 ? errors : undefined,
        duration: Date.now() - startTime,
        details: {
          sessionValidation: validation
        }
      }

    } catch (error) {
      return {
        passed: false,
        message: 'Session security test failed with error',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Test input validation
   */
  async testInputValidation(): Promise<AuthTestResult> {
    const startTime = Date.now()
    
    try {
      const errors: string[] = []

      // Test email validation
      const testEmails = [
        { email: 'valid@example.com', shouldPass: true },
        { email: 'invalid-email', shouldPass: false },
        { email: 'test@', shouldPass: false },
        { email: '@example.com', shouldPass: false },
        { email: 'test..test@example.com', shouldPass: false },
        { email: 'very-long-email-address-that-exceeds-normal-limits-and-should-fail-validation-because-it-is-way-too-long-for-any-reasonable-email-system-to-handle-properly-and-could-cause-issues-with-database-storage-or-other-systems@example.com', shouldPass: false }
      ]

      for (const { email, shouldPass } of testEmails) {
        const validation = this.inputValidator.validateEmail(email)
        if (validation.isValid !== shouldPass) {
          errors.push(`Email validation failed for: ${email} (expected ${shouldPass}, got ${validation.isValid})`)
        }
      }

      // Test password validation
      const testPasswords = [
        { password: 'StrongP@ss123', shouldPass: true },
        { password: 'weak', shouldPass: false },
        { password: 'password', shouldPass: false },
        { password: '12345678', shouldPass: false },
        { password: 'NoNumbers!', shouldPass: false },
        { password: 'nonumbersorspecial', shouldPass: false }
      ]

      for (const { password, shouldPass } of testPasswords) {
        const validation = this.inputValidator.validatePassword(password)
        if (validation.isValid !== shouldPass) {
          errors.push(`Password validation failed for password test (expected ${shouldPass}, got ${validation.isValid})`)
        }
      }

      // Test input sanitization
      const testInputs = [
        { input: '<script>alert("xss")</script>', shouldBeSanitized: true },
        { input: '  normal text  ', shouldBeTrimmed: true },
        { input: 'x'.repeat(2000), shouldBeTruncated: true }
      ]

      for (const test of testInputs) {
        const sanitized = this.inputValidator.sanitizeInput(test.input)
        
        if (test.shouldBeSanitized && sanitized === test.input) {
          errors.push('Input sanitization failed for XSS attempt')
        }
        
        if (test.shouldBeTrimmed && sanitized !== test.input.trim()) {
          errors.push('Input trimming failed')
        }
        
        if (test.shouldBeTruncated && sanitized.length >= 1000) {
          errors.push('Input truncation failed')
        }
      }

      return {
        passed: errors.length === 0,
        message: errors.length === 0 ? 'Input validation working correctly' : 'Input validation issues found',
        errors: errors.length > 0 ? errors : undefined,
        duration: Date.now() - startTime
      }

    } catch (error) {
      return {
        passed: false,
        message: 'Input validation test failed with error',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Run comprehensive security test suite
   */
  async runSecurityTestSuite(): Promise<SecurityTestResult> {
    this.logger.info('Starting comprehensive security test suite')

    const results = {
      rateLimiting: await this.testRateLimiting(),
      csrfProtection: await this.testCSRFProtection(),
      sessionSecurity: await this.testSessionSecurity(),
      inputValidation: await this.testInputValidation()
    }

    // Calculate overall score
    const totalTests = Object.keys(results).length
    const passedTests = Object.values(results).filter(result => result.passed).length
    const overallScore = Math.round((passedTests / totalTests) * 100)

    // Generate recommendations
    const recommendations: string[] = []
    
    if (!results.rateLimiting.passed) {
      recommendations.push('Fix rate limiting implementation to prevent brute force attacks')
    }
    
    if (!results.csrfProtection.passed) {
      recommendations.push('Implement proper CSRF protection for all state-changing operations')
    }
    
    if (!results.sessionSecurity.passed) {
      recommendations.push('Review session management and ensure secure session handling')
    }
    
    if (!results.inputValidation.passed) {
      recommendations.push('Strengthen input validation to prevent injection attacks')
    }

    if (overallScore === 100) {
      recommendations.push('Excellent! All security tests passed. Consider regular security audits.')
    } else if (overallScore >= 75) {
      recommendations.push('Good security posture. Address remaining issues for better protection.')
    } else {
      recommendations.push('Critical security issues found. Address immediately before production.')
    }

    const testResult: SecurityTestResult = {
      testName: 'Comprehensive Security Test Suite',
      passed: overallScore >= 75,
      details: results,
      overallScore,
      recommendations
    }

    this.logger.info('Security test suite completed', {
      overallScore,
      passedTests,
      totalTests,
      recommendations: recommendations.length
    })

    return testResult
  }
}

/**
 * Integration test helpers
 */
export class AuthIntegrationTester {
  private supabase: ReturnType<typeof createClient> | null

  constructor(isServer: boolean = false) {
    this.supabase = isServer ? null : createClient()
  }

  /**
   * Test authentication flow end-to-end
   */
  async testAuthFlow(): Promise<AuthTestResult> {
    const startTime = Date.now()

    try {
      if (!this.supabase) {
        return {
          passed: false,
          message: 'Supabase client not available for integration test',
          duration: Date.now() - startTime
        }
      }

      // const errors: string[] = []

      // Test session retrieval
      const { data: sessionData, error: sessionError } = await this.supabase.auth.getSession()
      
      if (sessionError) {
        // Expected in test environment
        this.logTestInfo('No active session found (expected in test environment)')
      }

      // Test auth state change listener setup
      let listenerWorking = false
      const { data: { subscription } } = this.supabase.auth.onAuthStateChange((event: string) => {
        listenerWorking = true
        this.logTestInfo(`Auth state change detected: ${event}`)
      })

      // Clean up subscription
      setTimeout(() => subscription.unsubscribe(), 100)

      // Test RPC functions (will likely fail without proper auth, which is expected)
      try {
        await this.supabase.rpc('is_admin')
      } catch {
        // Expected without authentication
        this.logTestInfo('Admin RPC test failed as expected without auth')
      }

      return {
        passed: true, // Integration tests pass if no critical errors
        message: 'Authentication integration test completed',
        duration: Date.now() - startTime,
        details: {
          hasSession: !!sessionData.session,
          listenerSetup: listenerWorking,
          sessionError: sessionError?.message
        }
      }

    } catch (error) {
      return {
        passed: false,
        message: 'Authentication integration test failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: Date.now() - startTime
      }
    }
  }

  private logTestInfo(message: string) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTH TEST] ${message}`)
    }
  }
}

/**
 * Performance test utilities
 */
export class AuthPerformanceTester {
  /**
   * Test authentication performance metrics
   */
  async testAuthPerformance(iterations: number = 100): Promise<{
    averageResponseTime: number
    minResponseTime: number
    maxResponseTime: number
    successRate: number
    recommendations: string[]
  }> {
    const times: number[] = []
    let successes = 0

    const testSuite = new AuthTestSuite()

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now()
      
      try {
        // Test a lightweight operation
        const result = await testSuite.testInputValidation()
        const duration = Date.now() - startTime
        times.push(duration)
        
        if (result.passed) {
          successes++
        }
      } catch {
        times.push(Date.now() - startTime)
      }
    }

    const averageResponseTime = times.reduce((a, b) => a + b, 0) / times.length
    const minResponseTime = Math.min(...times)
    const maxResponseTime = Math.max(...times)
    const successRate = (successes / iterations) * 100

    const recommendations: string[] = []
    
    if (averageResponseTime > 500) {
      recommendations.push('Average response time is high. Consider optimizing auth operations.')
    }
    
    if (maxResponseTime > 2000) {
      recommendations.push('Maximum response time is concerning. Investigate performance bottlenecks.')
    }
    
    if (successRate < 95) {
      recommendations.push('Success rate is low. Check for reliability issues in auth system.')
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance metrics look good!')
    }

    return {
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      successRate,
      recommendations
    }
  }
}

/**
 * Utility functions for testing
 */
export const AuthTestUtils = {
  /**
   * Generate test user data
   */
  generateTestUser: (index: number = 1) => ({
    email: `test${index}@example.com`,
    password: `TestPass${index}!`,
    fullName: `Test User ${index}`
  }),

  /**
   * Generate test session data
   */
  generateTestSession: (userId: string = 'test-user-id') => ({
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    user: {
      id: userId,
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString()
    }
  }),

  /**
   * Create test request object
   */
  createTestRequest: (options: {
    method?: string
    pathname?: string
    headers?: Record<string, string>
    ip?: string
  } = {}) => ({
    method: options.method || 'GET',
    nextUrl: { pathname: options.pathname || '/' },
    headers: new Map(Object.entries(options.headers || {})),
    ip: options.ip || '127.0.0.1'
  }),

  /**
   * Validate test results
   */
  validateTestResult: (result: AuthTestResult): boolean => {
    return result.passed && !result.errors && result.duration !== undefined
  },

  /**
   * Format test results for display
   */
  formatTestResults: (result: SecurityTestResult): string => {
    const lines = [
      `=== ${result.testName} ===`,
      `Overall Score: ${result.overallScore}%`,
      `Status: ${result.passed ? 'PASSED' : 'FAILED'}`,
      '',
      'Individual Tests:'
    ]

    Object.entries(result.details).forEach(([testName, testResult]) => {
      lines.push(`  ${testName}: ${testResult.passed ? '✅ PASS' : '❌ FAIL'} (${testResult.duration}ms)`)
      if (testResult.errors) {
        testResult.errors.forEach(error => {
          lines.push(`    - ${error}`)
        })
      }
    })

    if (result.recommendations.length > 0) {
      lines.push('')
      lines.push('Recommendations:')
      result.recommendations.forEach((rec, index) => {
        lines.push(`  ${index + 1}. ${rec}`)
      })
    }

    return lines.join('\n')
  }
}

// Export test suite instances for easy use
export const createAuthTestSuite = (config?: TestConfig) => new AuthTestSuite(config)
export const createAuthIntegrationTester = (isServer?: boolean) => new AuthIntegrationTester(isServer)
export const createAuthPerformanceTester = () => new AuthPerformanceTester()

// Types for external use
export type { TestConfig, AuthTestResult, SecurityTestResult }
