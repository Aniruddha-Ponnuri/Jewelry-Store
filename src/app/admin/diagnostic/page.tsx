'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRobustAuth } from '@/hooks/useRobustAuth'
import RobustAdminLayout from '@/components/RobustAdminLayout'
import AdminDiagnostic from '@/components/AdminDiagnostic'
import AdminTroubleshooter from '@/components/AdminTroubleshooter'
import AuthDebugPanel from '@/components/AuthDebugPanel'
import QuickAdminTest from '@/components/QuickAdminTest'
import AdminDebug from '@/components/AdminDebug'
import AdminUsersDebug from '@/components/AdminUsersDebug'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Activity, Bug, Wrench, TestTube, Shield, Users, RefreshCw, XCircle, Package, FolderOpen, Database } from 'lucide-react'

export default function AdminDiagnosticPage() {
  const auth = useRobustAuth({
    requireAuth: true,
    requireAdmin: true,
    requireMasterAdmin: true, // Only master admins can access diagnostic page
    redirectOnFail: '/',
    refreshInterval: 60000
  })

  const [activeView, setActiveView] = useState('overview')

interface TestResult {
  name: string;
  status: 'testing' | 'success' | 'error' | 'warning';
  message: string;
  details?: Record<string, unknown>;
}

  const [comprehensiveTestResults, setComprehensiveTestResults] = useState<TestResult[]>([])
  const [comprehensiveTesting, setComprehensiveTesting] = useState(false)
  const supabase = createClient()

  const NavButton = ({ id, icon: Icon, children, active }: { 
    id: string, 
    icon: React.ComponentType<{ className?: string }>, 
    children: React.ReactNode, 
    active: boolean 
  }) => (
    <Button
      onClick={() => setActiveView(id)}
      variant={active ? "default" : "outline"}
      className={`flex items-center space-x-2 ${active ? 'bg-blue-600 text-white' : ''}`}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Button>
  )

  return (
    <RobustAdminLayout 
      title="Master Admin Diagnostic Center" 
      description="Comprehensive diagnostic tools for admin authentication, storage, and system health (Master Admin Only)"
      requireMasterAdmin={true}
    >
      {/* Header with System Status */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-2xl text-blue-900 flex items-center gap-3">
                  Master Admin Diagnostic Center
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Master Admin Only
                  </Badge>
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Monitor and troubleshoot admin authentication, storage, and system functionality
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                System Online
              </Badge>
              {auth.isAuthenticated && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin Authenticated
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <NavButton id="overview" icon={Activity} active={activeView === 'overview'}>
              Overview
            </NavButton>
            <NavButton id="admin-debug" icon={Shield} active={activeView === 'admin-debug'}>
              Admin Debug Panel
            </NavButton>
            <NavButton id="users-debug" icon={Users} active={activeView === 'users-debug'}>
              Users Debug
            </NavButton>
            <NavButton id="diagnostic" icon={Bug} active={activeView === 'diagnostic'}>
              Full Diagnostic
            </NavButton>
            <NavButton id="troubleshooter" icon={Wrench} active={activeView === 'troubleshooter'}>
              Troubleshooter
            </NavButton>
            <NavButton id="auth-debug" icon={Shield} active={activeView === 'auth-debug'}>
              Auth Debug
            </NavButton>
            <NavButton id="quick-test" icon={TestTube} active={activeView === 'quick-test'}>
              Quick Test
            </NavButton>
            <NavButton id="comprehensive-test" icon={Activity} active={activeView === 'comprehensive-test'}>
              Comprehensive Test
            </NavButton>
          </div>
        </CardContent>
      </Card>

      {/* Overview View */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <span>Current Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Authentication</span>
                  <Badge variant={auth.isAuthenticated ? "default" : "destructive"}>
                    {auth.isAuthenticated ? "✅ Active" : "❌ Failed"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Admin Status</span>
                  <Badge variant={auth.isAdmin ? "default" : "secondary"}>
                    {auth.isAdmin ? "✅ Admin" : "👤 User"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Master Admin</span>
                  <Badge variant={auth.isMasterAdmin ? "default" : "secondary"}>
                    {auth.isMasterAdmin ? "✅ Master" : "❌ No"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setActiveView('admin-debug')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Debug Panel
                </Button>
                <Button 
                  onClick={() => setActiveView('users-debug')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Users Debug
                </Button>
                <Button 
                  onClick={() => setActiveView('diagnostic')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Run Full Diagnostic
                </Button>
                <Button 
                  onClick={() => setActiveView('troubleshooter')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  System Troubleshooter
                </Button>
                <Button 
                  onClick={() => setActiveView('quick-test')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Fast Admin Status & Functionality Verification
                </Button>
                <Button 
                  onClick={() => setActiveView('comprehensive-test')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Comprehensive Test Suite
                </Button>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span>System Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>User ID</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {auth.user?.id?.slice(0, 8) || 'N/A'}...
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span>Email</span>
                  <span className="text-sm text-gray-600 truncate max-w-32">
                    {auth.user?.email || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Last Verification</span>
                  <span className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Full Diagnostic View */}
      {activeView === 'diagnostic' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bug className="h-5 w-5 text-red-600" />
              <span>Comprehensive System Diagnostic</span>
            </CardTitle>
            <CardDescription>
              Deep system analysis for admin creation and image upload functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminDiagnostic />
          </CardContent>
        </Card>
      )}

      {/* Troubleshooter View */}
      {activeView === 'troubleshooter' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              <span>System Troubleshooter</span>
            </CardTitle>
            <CardDescription>
              Automated troubleshooting and system health checks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminTroubleshooter />
          </CardContent>
        </Card>
      )}

      {/* Auth Debug View */}
      {activeView === 'auth-debug' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span>Authentication Debug Panel</span>
            </CardTitle>
            <CardDescription>
              Detailed authentication session and storage analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthDebugPanel />
          </CardContent>
        </Card>
      )}

      {/* Quick Test View */}
      {activeView === 'quick-test' && (
        <QuickAdminTest />
      )}

      {/* Admin Debug Panel View */}
      {activeView === 'admin-debug' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Admin Debug Panel</span>
            </CardTitle>
            <CardDescription>
              Essential debug information for admin authentication status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminDebug />
          </CardContent>
        </Card>
      )}

      {/* Users Debug View */}
      {activeView === 'users-debug' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Admin Users Debug</span>
            </CardTitle>
            <CardDescription>
              Debug tools for admin users table and management functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminUsersDebug />
          </CardContent>
        </Card>
      )}

      {/* Comprehensive Test View */}
      {activeView === 'comprehensive-test' && (
        <ComprehensiveTestView />
      )}
    </RobustAdminLayout>
  )

  function ComprehensiveTestView() {
    const runComprehensiveTests = useCallback(async () => {
      setComprehensiveTesting(true)
      const results: TestResult[] = []

      // Test 1: Authentication
      try {
        results.push({ name: 'Authentication Status', status: 'testing', message: 'Checking authentication...' })
        setComprehensiveTestResults([...results])

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
      setComprehensiveTestResults([...results])

      // Test 2: Database Functions
      try {
        results.push({ name: 'Database Admin Functions', status: 'testing', message: 'Testing admin RPC functions...' })
        setComprehensiveTestResults([...results])

        const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')
        const { data: isMasterAdmin, error: masterError } = await supabase.rpc('is_master_admin')

        if (!adminError && !masterError && isAdmin) {
          results[results.length - 1] = {
            name: 'Database Admin Functions',
            status: 'success',
            message: `Database functions working: Admin=${isAdmin}, Master=${isMasterAdmin}`,
            details: { isAdmin, isMasterAdmin }
          }
        } else {
          results[results.length - 1] = {
            name: 'Database Admin Functions',
            status: 'error',
            message: `Database function issues: ${adminError?.message || masterError?.message || 'Not admin'}`,
            details: { adminError: adminError?.message, masterError: masterError?.message }
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
      setComprehensiveTestResults([...results])

      // Test 3: Products Management
      try {
        results.push({ name: 'Products Management', status: 'testing', message: 'Testing product operations...' })
        setComprehensiveTestResults([...results])

        const { data: products, error: productsError } = await supabase.from('products').select('*').limit(5)

        if (!productsError) {
          results[results.length - 1] = {
            name: 'Products Management',
            status: 'success',
            message: `Products accessible: ${products?.length || 0} products found`,
            details: { productCount: products?.length || 0 }
          }
        } else {
          results[results.length - 1] = {
            name: 'Products Management',
            status: 'error',
            message: `Products access failed: ${productsError.message}`,
            details: { error: productsError.message }
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
      setComprehensiveTestResults([...results])

      // Test 4: Categories Management
      try {
        results.push({ name: 'Categories Management', status: 'testing', message: 'Testing category operations...' })
        setComprehensiveTestResults([...results])

        const { data: categories, error: loadError } = await supabase.from('categories').select('*').order('created_at', { ascending: false })

        if (!loadError) {
          results[results.length - 1] = {
            name: 'Categories Management',
            status: 'success',
            message: `Categories loaded: ${categories?.length || 0} found`,
            details: { count: categories?.length || 0 }
          }
        } else {
          results[results.length - 1] = {
            name: 'Categories Management',
            status: 'error',
            message: `Categories load failed: ${loadError.message}`,
            details: { error: loadError.message }
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
      setComprehensiveTestResults([...results])

      // Test 5: Users Management
      try {
        results.push({ name: 'Users Management', status: 'testing', message: 'Testing user management...' })
        setComprehensiveTestResults([...results])

        if (!auth.isMasterAdmin) {
          results[results.length - 1] = {
            name: 'Users Management',
            status: 'warning',
            message: 'Skipped: Requires Master Admin privileges',
            details: { isMasterAdmin: false }
          }
        } else {
          const { data: adminUsers, error: usersError } = await supabase.from('admin_users').select('*').eq('is_active', true)

          if (!usersError) {
            results[results.length - 1] = {
              name: 'Users Management',
              status: 'success',
              message: `Admin users loaded: ${adminUsers?.length || 0} found`,
              details: { count: adminUsers?.length || 0 }
            }
          } else {
            results[results.length - 1] = {
              name: 'Users Management',
              status: 'error',
              message: `Users load failed: ${usersError.message}`,
              details: { error: usersError.message }
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
      setComprehensiveTestResults([...results])

      // Test 6: Storage
      try {
        results.push({ name: 'Storage & Upload', status: 'testing', message: 'Testing storage access...' })
        setComprehensiveTestResults([...results])

        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
        const imagesBucket = buckets?.find(b => b.name === 'images')

        if (!bucketsError && imagesBucket) {
          results[results.length - 1] = {
            name: 'Storage & Upload',
            status: 'success',
            message: `Storage accessible: ${buckets?.length || 0} buckets, images bucket found`,
            details: { totalBuckets: buckets?.length || 0, imagesBucketExists: true }
          }
        } else if (!bucketsError && !imagesBucket) {
          results[results.length - 1] = {
            name: 'Storage & Upload',
            status: 'warning',
            message: `Storage accessible but images bucket missing`,
            details: { totalBuckets: buckets?.length || 0, imagesBucketExists: false }
          }
        } else {
          results[results.length - 1] = {
            name: 'Storage & Upload',
            status: 'error',
            message: `Storage access failed: ${bucketsError?.message}`,
            details: { error: bucketsError?.message }
          }
        }
      } catch (error) {
        results[results.length - 1] = {
          name: 'Storage & Upload',
          status: 'error',
          message: `Storage test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { error }
        }
      }
      setComprehensiveTestResults([...results])

      setComprehensiveTesting(false)
    }, [])

    const getTestIcon = (testName: string) => {
      if (testName.includes('Authentication')) return <Shield className="w-4 h-4" />
      if (testName.includes('Database')) return <Database className="w-4 h-4" />
      if (testName.includes('Products')) return <Package className="w-4 h-4" />
      if (testName.includes('Categories')) return <FolderOpen className="w-4 h-4" />
      if (testName.includes('Users')) return <Users className="w-4 h-4" />
      if (testName.includes('Storage')) return <Database className="w-4 h-4" />
      return <TestTube className="w-4 h-4" />
    }

    const successCount = comprehensiveTestResults.filter(r => r.status === 'success').length
    const errorCount = comprehensiveTestResults.filter(r => r.status === 'error').length
    const warningCount = comprehensiveTestResults.filter(r => r.status === 'warning').length

    return (
      <Card className="w-full bg-white border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50/50">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                {comprehensiveTesting ? (
                  <RefreshCw className="h-4 w-4 text-white animate-spin" />
                ) : errorCount > 0 ? (
                  <XCircle className="h-4 w-4 text-white" />
                ) : warningCount > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-white" />
                ) : comprehensiveTestResults.length > 0 ? (
                  <CheckCircle className="h-4 w-4 text-white" />
                ) : (
                  <Activity className="h-4 w-4 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Comprehensive Test Suite</h3>
                <p className="text-sm text-gray-600 font-normal">Complete verification of all admin functions from /test page</p>
              </div>
            </div>
            {comprehensiveTesting ? (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Testing...
              </Badge>
            ) : comprehensiveTestResults.length > 0 ? (
              <Badge variant="outline" className={errorCount > 0 ? "bg-red-50 text-red-700 border-red-200" : warningCount > 0 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-green-50 text-green-700 border-green-200"}>
                {errorCount > 0 ? (
                  <><XCircle className="h-3 w-3 mr-1" />{errorCount} Error{errorCount > 1 ? 's' : ''}</>
                ) : warningCount > 0 ? (
                  <><AlertTriangle className="h-3 w-3 mr-1" />{warningCount} Warning{warningCount > 1 ? 's' : ''}</>
                ) : (
                  <><CheckCircle className="h-3 w-3 mr-1" />All Tests Passed</>
                )}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                <Activity className="h-3 w-3 mr-1" />
                Ready to Test
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Test Summary */}
            {comprehensiveTestResults.length > 0 && (
              <div className="flex gap-4 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Success: {successCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span>Warning: {warningCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>Error: {errorCount}</span>
                </div>
              </div>
            )}

            {/* Test Button */}
            <Button 
              onClick={runComprehensiveTests} 
              disabled={comprehensiveTesting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2"
            >
              {comprehensiveTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Comprehensive Tests...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  Run All Admin Function Tests
                </>
              )}
            </Button>

            {/* Test Results */}
            {comprehensiveTestResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <TestTube className="w-4 h-4" />
                  Test Results ({comprehensiveTestResults.length} tests)
                </h4>
                
                {comprehensiveTestResults.map((result, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className={`px-4 py-3 border-b border-gray-200 ${
                      result.status === 'success' ? 'bg-green-50' :
                      result.status === 'warning' ? 'bg-yellow-50' :
                      result.status === 'error' ? 'bg-red-50' :
                      'bg-blue-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTestIcon(result.name)}
                          <span className="font-medium text-gray-800">{result.name}</span>
                        </div>
                        <Badge variant="outline" className={
                          result.status === 'success' ? 'bg-green-100 text-green-800 border-green-300' :
                          result.status === 'warning' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                          result.status === 'error' ? 'bg-red-100 text-red-800 border-red-300' :
                          'bg-blue-100 text-blue-800 border-blue-300'
                        }>
                          {result.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {result.status === 'warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {result.status === 'error' && <XCircle className="w-3 h-3 mr-1" />}
                          {result.status === 'testing' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                          {result.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                    </div>
                    
                    {result.details && (
                      <div className="p-4">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800 mb-2">
                            View Technical Details
                          </summary>
                          <pre className="text-xs font-mono bg-gray-50 p-3 rounded-lg border overflow-auto leading-relaxed text-gray-800">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
}
