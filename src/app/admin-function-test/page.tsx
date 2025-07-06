'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/hooks/useAdmin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, User, Database, Code } from 'lucide-react'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning' | 'pending'
  message: string
  details?: unknown
}

export default function AdminFunctionTestPage() {
  const { user } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const supabase = createClient()

  const addResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result])
  }

  const clearResults = () => {
    setTestResults([])
  }

  const runComprehensiveTest = async () => {
    setTesting(true)
    clearResults()

    try {
      // Test 1: Check current user context
      addResult({
        name: 'User Authentication',
        status: user ? 'success' : 'error',
        message: user ? `Logged in as ${user.email}` : 'No user logged in',
        details: { userId: user?.id, email: user?.email }
      })

      if (!user) {
        setTesting(false)
        return
      }

      // Test 2: Test is_admin function directly
      try {
        const { data: isAdminResult, error: isAdminError } = await supabase.rpc('is_admin')
        addResult({
          name: 'is_admin() Function',
          status: isAdminError ? 'error' : 'success',
          message: isAdminError ? `Error: ${isAdminError.message}` : `Result: ${Boolean(isAdminResult)}`,
          details: { result: isAdminResult, error: isAdminError }
        })
      } catch (error) {
        addResult({
          name: 'is_admin() Function',
          status: 'error',
          message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { error }
        })
      }

      // Test 3: Test debug_admin_status function
      try {
        const { data: debugResult, error: debugError } = await supabase.rpc('debug_admin_status')
        addResult({
          name: 'debug_admin_status() Function',
          status: debugError ? 'error' : 'success',
          message: debugError ? `Error: ${debugError.message}` : 'Debug function working',
          details: debugResult
        })
      } catch (error) {
        addResult({
          name: 'debug_admin_status() Function',
          status: 'error',
          message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { error }
        })
      }

      // Test 4: Check admin_users table access
      try {
        const { data: adminUsers, error: adminUsersError } = await supabase
          .from('admin_users')
          .select('*')
          .limit(5)

        addResult({
          name: 'admin_users Table Access',
          status: adminUsersError ? 'error' : 'success',
          message: adminUsersError ? `Error: ${adminUsersError.message}` : `Found ${adminUsers?.length || 0} admin records`,
          details: { adminUsers, error: adminUsersError }
        })
      } catch (error) {
        addResult({
          name: 'admin_users Table Access',
          status: 'error',
          message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { error }
        })
      }

      // Test 5: Check useAdmin hook result
      addResult({
        name: 'useAdmin Hook',
        status: adminLoading ? 'pending' : 'success',
        message: adminLoading ? 'Loading...' : `isAdmin: ${isAdmin}`,
        details: { isAdmin, loading: adminLoading }
      })

      // Test 6: Check RLS policies
      try {
        const { data: policies, error: policiesError } = await supabase
          .from('admin_users')
          .select('user_id, email, is_active')
          .eq('user_id', user.id)

        addResult({
          name: 'RLS Policy Check',
          status: policiesError ? 'warning' : 'success',
          message: policiesError ? `Policy error: ${policiesError.message}` : `Can access own admin record: ${policies?.length ? 'Yes' : 'No'}`,
          details: { policies, error: policiesError }
        })
      } catch (error) {
        addResult({
          name: 'RLS Policy Check',
          status: 'warning',
          message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { error }
        })
      }

    } catch (error) {
      addResult({
        name: 'Test Suite',
        status: 'error',
        message: `Test suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      })
    } finally {
      setTesting(false)
    }
  }

  const testAddAdmin = async () => {
    if (!testEmail) {
      alert('Please enter an email address')
      return
    }

    try {
      const { data, error } = await supabase.rpc('add_admin', { admin_email: testEmail })
      addResult({
        name: 'add_admin() Test',
        status: error ? 'error' : 'success',
        message: error ? `Error: ${error.message}` : `Success: ${data}`,
        details: { data, error, email: testEmail }
      })
    } catch (error) {
      addResult({
        name: 'add_admin() Test',
        status: 'error',
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error, email: testEmail }
      })
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'pending':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'pending':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Functions Test Suite</h1>
          <p className="text-muted-foreground">Comprehensive testing of admin authentication functions</p>
        </div>
        <Button onClick={runComprehensiveTest} disabled={testing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'Testing...' : 'Run Tests'}
        </Button>
      </div>

      {/* Current Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Status</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user ? 'Logged In' : 'Not Logged In'}</div>
            <p className="text-xs text-muted-foreground">{user?.email || 'No user'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminLoading ? 'Loading...' : (isAdmin ? 'Admin' : 'Not Admin')}
            </div>
            <p className="text-xs text-muted-foreground">
              {adminLoading ? 'Checking permissions...' : (isAdmin ? 'Has admin access' : 'No admin access')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Results</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testResults.length}</div>
            <p className="text-xs text-muted-foreground">
              {testResults.filter(r => r.status === 'success').length} passed, {testResults.filter(r => r.status === 'error').length} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Admin Test */}
      <Card>
        <CardHeader>
          <CardTitle>Test Add Admin Function</CardTitle>
          <CardDescription>Test adding a user as admin (use your own email for safety)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="testEmail">Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="user@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={testAddAdmin} disabled={!testEmail || testing}>
                Test Add Admin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>Detailed results of admin function tests</CardDescription>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No tests run yet. Click &quot;Run Tests&quot; to start.</p>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.name}</span>
                    </div>
                    <Badge variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                      {result.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                  {result.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Show Details</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common troubleshooting actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" asChild className="w-full">
            <a href="/admin" target="_blank">Try Admin Dashboard</a>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <a href="/admin-debug" target="_blank">Open Admin Debug Tool</a>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <a href="/debug-admin" target="_blank">Alternative Debug Page</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
