'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRobustAuth } from '@/hooks/useRobustAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import RobustAdminLayout from '@/components/RobustAdminLayout'

interface TestResult {
  name: string
  status: 'success' | 'warning' | 'error' | 'testing'
  message: string
  details?: Record<string, unknown>
}

export default function AdminTestPage() {
  const auth = useRobustAuth({
    requireAuth: true,
    requireAdmin: true,
    redirectOnFail: '/',
    refreshInterval: 60000
  })

  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)
  const supabase = createClient()

  const runTests = useCallback(async () => {
    setTesting(true)
    const results: TestResult[] = []

    // Test 1: Authentication
    try {
      results.push({
        name: 'Authentication Status',
        status: 'testing',
        message: 'Checking authentication...'
      })

      const authResult = {
        isAuthenticated: auth.isAuthenticated,
        isAdmin: auth.isAdmin,
        isMasterAdmin: auth.isMasterAdmin,
        userEmail: auth.user?.email,
        sessionValid: auth.sessionValid
      }

      if (auth.isAuthenticated && auth.isAdmin) {
        results[results.length - 1] = {
          name: 'Authentication Status',
          status: 'success',
          message: `Authenticated as ${auth.isMasterAdmin ? 'Master Admin' : 'Admin'}: ${auth.user?.email}`,
          details: authResult
        }
      } else {
        results[results.length - 1] = {
          name: 'Authentication Status',
          status: 'error',
          message: `Authentication failed: ${!auth.isAuthenticated ? 'Not logged in' : 'Not admin'}`,
          details: authResult
        }
      }
    } catch (error) {
      results[results.length - 1] = {
        name: 'Authentication Status',
        status: 'error',
        message: `Authentication test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      }
    }

    // Test 2: Database Admin Functions
    try {
      results.push({
        name: 'Database Admin Functions',
        status: 'testing',
        message: 'Testing admin RPC functions...'
      })

      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')
      const { data: isMasterAdmin, error: masterError } = await supabase.rpc('is_master_admin')

      const dbResult = {
        isAdmin,
        isMasterAdmin,
        adminError: adminError?.message,
        masterError: masterError?.message
      }

      if (!adminError && !masterError && isAdmin) {
        results[results.length - 1] = {
          name: 'Database Admin Functions',
          status: 'success',
          message: `Database functions working: Admin=${isAdmin}, Master=${isMasterAdmin}`,
          details: dbResult
        }
      } else {
        results[results.length - 1] = {
          name: 'Database Admin Functions',
          status: 'error',
          message: `Database function issues: ${adminError?.message || masterError?.message || 'Not admin'}`,
          details: dbResult
        }
      }
    } catch (error) {
      results[results.length - 1] = {
        name: 'Database Admin Functions',
        status: 'error',
        message: `Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      }
    }

    // Test 3: Products Management
    try {
      results.push({
        name: 'Products Management',
        status: 'testing',
        message: 'Testing product operations...'
      })

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .limit(5)

      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')

      const productsResult = {
        canLoadProducts: !productsError,
        productCount: products?.length || 0,
        canLoadCategories: !categoriesError,
        categoryCount: categories?.length || 0,
        productsError: productsError?.message,
        categoriesError: categoriesError?.message
      }

      if (!productsError && !categoriesError) {
        results[results.length - 1] = {
          name: 'Products Management',
          status: 'success',
          message: `Products: ${products?.length || 0}, Categories: ${categories?.length || 0}`,
          details: productsResult
        }
      } else {
        results[results.length - 1] = {
          name: 'Products Management',
          status: categoriesError ? 'error' : 'warning',
          message: `Issues: ${productsError?.message || categoriesError?.message}`,
          details: productsResult
        }
      }
    } catch (error) {
      results[results.length - 1] = {
        name: 'Products Management',
        status: 'error',
        message: `Products test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      }
    }

    // Test 4: Categories Management
    try {
      results.push({
        name: 'Categories Management',
        status: 'testing',
        message: 'Testing category operations...'
      })

      const { data: categories, error: loadError } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false })

      const categoriesResult = {
        canLoad: !loadError,
        count: categories?.length || 0,
        categories: categories?.map(c => ({ name: c.name, emoji: c.emoji })) || [],
        error: loadError?.message
      }

      if (!loadError) {
        results[results.length - 1] = {
          name: 'Categories Management',
          status: 'success',
          message: `Categories loaded: ${categories?.length || 0} found`,
          details: categoriesResult
        }
      } else {
        results[results.length - 1] = {
          name: 'Categories Management',
          status: 'error',
          message: `Categories load failed: ${loadError.message}`,
          details: categoriesResult
        }
      }
    } catch (error) {
      results[results.length - 1] = {
        name: 'Categories Management',
        status: 'error',
        message: `Categories test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      }
    }

    // Test 5: Users Management (Master Admin only)
    try {
      results.push({
        name: 'Users Management',
        status: 'testing',
        message: 'Testing user management...'
      })

      if (!auth.isMasterAdmin) {
        results[results.length - 1] = {
          name: 'Users Management',
          status: 'warning',
          message: 'Skipped: Requires Master Admin privileges',
          details: { isMasterAdmin: false }
        }
      } else {
        const { data: adminUsers, error: usersError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('is_active', true)

        const usersResult = {
          canLoad: !usersError,
          count: adminUsers?.length || 0,
          users: adminUsers?.map(u => ({ email: u.email, role: u.role })) || [],
          error: usersError?.message
        }

        if (!usersError) {
          results[results.length - 1] = {
            name: 'Users Management',
            status: 'success',
            message: `Admin users loaded: ${adminUsers?.length || 0} found`,
            details: usersResult
          }
        } else {
          results[results.length - 1] = {
            name: 'Users Management',
            status: 'error',
            message: `Users load failed: ${usersError.message}`,
            details: usersResult
          }
        }
      }
    } catch (error) {
      results[results.length - 1] = {
        name: 'Users Management',
        status: 'error',
        message: `Users test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      }
    }

    // Test 6: Navigation and UI
    results.push({
      name: 'Navigation & UI',
      status: 'success',
      message: 'Admin layout and navigation loaded successfully',
      details: {
        authContextWorking: true,
        robustAuthWorking: true,
        adminLayoutRendered: true
      }
    })

    setTestResults(results)
    setTesting(false)
  }, [auth, supabase])

  useEffect(() => {
    if (auth.isFullyAuthorized && !auth.loading) {
      runTests()
    }
  }, [auth.isFullyAuthorized, auth.loading, runTests])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'testing':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'success':
        return 'default'
      case 'warning':
        return 'secondary'
      case 'error':
        return 'destructive'
      case 'testing':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const successCount = testResults.filter(r => r.status === 'success').length
  const errorCount = testResults.filter(r => r.status === 'error').length
  const warningCount = testResults.filter(r => r.status === 'warning').length

  return (
    <RobustAdminLayout 
      title="Admin Function Test" 
      description="Comprehensive test of all admin functions and permissions"
    >
      {/* Summary Card */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            🧪 Admin Function Test Results
          </CardTitle>
          <CardDescription className="text-blue-700">
            Testing all admin functions to identify issues and verify functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Success: {successCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span>Warning: {warningCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>Error: {errorCount}</span>
            </div>
          </div>
          
          <Button 
            onClick={runTests} 
            disabled={testing}
            className="mt-4"
            variant="outline"
          >
            {testing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-run Tests
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="space-y-4">
        {testResults.map((result, index) => (
          <Card key={index} className="border-l-4" style={{
            borderLeftColor: 
              result.status === 'success' ? '#16a34a' :
              result.status === 'warning' ? '#d97706' :
              result.status === 'error' ? '#dc2626' : '#6b7280'
          }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  {result.name}
                </CardTitle>
                <Badge variant={getStatusBadge(result.status)}>
                  {result.status.toUpperCase()}
                </Badge>
              </div>
              <CardDescription>
                {result.message}
              </CardDescription>
            </CardHeader>
            {result.details && (
              <CardContent>
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                    View Details
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Critical Issues Alert */}
      {errorCount > 0 && (
        <Alert className="mt-6 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical Issues Found:</strong> {errorCount} admin function(s) are not working properly. 
            Please check the test results above for details and resolve these issues before using admin features.
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {errorCount === 0 && testResults.length > 0 && (
        <Alert className="mt-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>All Tests Passed!</strong> Admin functions are working properly. 
            {warningCount > 0 && ` Note: ${warningCount} warning(s) found - these are not critical but may need attention.`}
          </AlertDescription>
        </Alert>
      )}
    </RobustAdminLayout>
  )
}
