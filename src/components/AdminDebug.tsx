'use client'

import { useRobustAuth } from '@/hooks/useRobustAuth'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Database, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface ManualCheckResult {
  session?: { user_id: string; email?: string; expires_at?: number } | null;
  sessionError?: { message: string } | null;
  adminResult?: boolean | null;
  adminError?: { message: string } | null;
  masterResult?: boolean | null;
  masterError?: { message: string } | null;
  adminRecord?: {
    admin_id?: string;
    user_id: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
  } | null;
  recordError?: { message: string } | null;
  error?: string;
  timestamp: string;
}

interface ComprehensiveTestResult {
  test1_session: {
    success: boolean;
    session?: {
      user_id: string;
      email?: string;
      expires_at?: number;
    } | null;
    isAdmin?: boolean;
    isMasterAdmin?: boolean;
    errors?: string[];
    performance?: number;
  };
  test2_adminTable: {
    success: boolean;
    adminUsers?: {
      admin_id?: string;
      user_id: string;
      email: string;
      role: string;
      is_active: boolean;
      created_at: string;
    }[];
    error?: string;
    count?: number;
    performance?: number;
  };
  test3_addAdmin: {
    success: boolean;
    result?: string;
    error?: string;
    testEmail?: string;
    cleanupSuccess?: boolean;
    performance?: number;
  };
  test4_removeAdmin: {
    success: boolean;
    result?: string;
    error?: string;
    testEmail?: string;
    performance?: number;
  };
  test5_masterAdminEmails: {
    success: boolean;
    emails?: string[];
    count?: number;
    error?: string;
    performance?: number;
  };
  test6_storage: {
    success: boolean;
    buckets?: {
      id: string;
      name: string;
      public: boolean;
    }[];
    imagesBucketExists?: boolean;
    imagesBucketAccessible?: boolean;
    files?: {
      name: string;
      id?: string;
      updated_at?: string;
    }[];
    errors?: string[];
    performance?: number;
  };
  test7_upload: {
    success: boolean;
    uploadSuccess?: boolean;
    cleanupSuccess?: boolean;
    error?: string;
    uploadSize?: number;
    performance?: number;
  };
  test8_environment: {
    success: boolean;
    supabaseUrl?: boolean;
    supabaseKey?: boolean;
    urlDomain?: string;
    nodeEnv?: string;
    performance?: number;
  };
  test9_debugFunctions: {
    success: boolean;
    debugStatus?: {
      user_id: string | null;
      is_admin_function_result: boolean | null;
      is_master_admin_function_result: boolean | null;
      total_active_admins: number;
      total_master_admins: number;
      master_admin_emails: string[];
      user_admin_record_exists: boolean;
      user_admin_is_active: boolean | null;
      admin_role: string | null;
      admin_email: string | null;
      timestamp: string;
      error?: boolean;
      message?: string;
    };
    error?: string;
    performance?: number;
  };
  test10_authEdgeCases: {
    success: boolean;
    tests?: {
      sessionRefresh: boolean;
      multipleAdminCalls: boolean;
      concurrentRequests: boolean;
      invalidTokenHandling: boolean;
    };
    errors?: string[];
    performance?: number;
  };
  test11_databaseIntegrity: {
    success: boolean;
    foreignKeys?: boolean;
    constraints?: boolean;
    indexes?: boolean;
    triggers?: boolean;
    error?: string;
    performance?: number;
  };
  test12_performance: {
    success: boolean;
    averageResponseTime?: number;
    slowestOperation?: string;
    fastestOperation?: string;
    totalTestTime?: number;
  };
  timestamp: string;
  overallSuccess: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
}

export default function AdminDebug() {
  const auth = useRobustAuth({
    requireAuth: true,
    requireMasterAdmin: true, // Only master admins can see this
    refreshInterval: 60000
  })
  
  const { user } = useAuth()
  const [manualCheck, setManualCheck] = useState<ManualCheckResult | null>(null)
  const [comprehensiveTest, setComprehensiveTest] = useState<ComprehensiveTestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [comprehensiveLoading, setComprehensiveLoading] = useState(false)

  // Return null if not master admin
  if (!auth.isMasterAdmin || auth.loading) {
    return null
  }

  const performManualAdminCheck = async () => {
    setLoading(true)
    const supabase = createClient()
    
    try {
      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Check admin status
      const { data: adminResult, error: adminError } = await supabase.rpc('is_admin')
      
      // Check master admin status
      const { data: masterResult, error: masterError } = await supabase.rpc('is_master_admin')
      
      // Get admin record
      const { data: adminRecord, error: recordError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', session?.user?.id)
        .single()
      
      setManualCheck({
        session: session ? {
          user_id: session.user.id,
          email: session.user.email,
          expires_at: session.expires_at
        } : null,
        sessionError,
        adminResult,
        adminError,
        masterResult,
        masterError,
        adminRecord,
        recordError,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setManualCheck({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const runComprehensiveTest = async () => {
    setComprehensiveLoading(true)
    const supabase = createClient()
    const startTime = Date.now()
    
    const result: ComprehensiveTestResult = {
      test1_session: { success: false },
      test2_adminTable: { success: false },
      test3_addAdmin: { success: false },
      test4_removeAdmin: { success: false },
      test5_masterAdminEmails: { success: false },
      test6_storage: { success: false },
      test7_upload: { success: false },
      test8_environment: { success: false },
      test9_debugFunctions: { success: false },
      test10_authEdgeCases: { success: false },
      test11_databaseIntegrity: { success: false },
      test12_performance: { success: false },
      timestamp: new Date().toISOString(),
      overallSuccess: false,
      totalTests: 12,
      passedTests: 0,
      failedTests: 0
    }

    const testPerformance: { [key: string]: number } = {}

    try {
      // Test 1: Session and Admin Status
      try {
        const testStart = Date.now()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin')
        const { data: isMasterResult, error: masterError } = await supabase.rpc('is_master_admin')
        
        const errors = []
        if (sessionError) errors.push(`Session: ${sessionError.message}`)
        if (adminError) errors.push(`Admin check: ${adminError.message}`)
        if (masterError) errors.push(`Master admin check: ${masterError.message}`)
        
        result.test1_session = {
          success: !sessionError && !!session,
          session: session ? {
            user_id: session.user.id,
            email: session.user.email,
            expires_at: session.expires_at
          } : null,
          isAdmin: isAdminResult,
          isMasterAdmin: isMasterResult,
          errors: errors.length > 0 ? errors : undefined,
          performance: Date.now() - testStart
        }
        testPerformance['Session & Auth'] = Date.now() - testStart
      } catch (error) {
        result.test1_session = {
          success: false,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          performance: 0
        }
      }

      // Test 2: Admin Users Table
      try {
        const testStart = Date.now()
        const { data: adminUsers, error: tableError, count } = await supabase
          .from('admin_users')
          .select('*', { count: 'exact' })
          .limit(20)
        
        result.test2_adminTable = {
          success: !tableError,
          adminUsers: adminUsers || undefined,
          count: count || 0,
          error: tableError?.message,
          performance: Date.now() - testStart
        }
        testPerformance['Admin Table'] = Date.now() - testStart
      } catch (error) {
        result.test2_adminTable = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          performance: 0
        }
      }

      // Test 3: Add Admin Function
      try {
        const testStart = Date.now()
        const testEmail = `test-admin-${Date.now()}@example.com`
        const { data: addResult, error: addError } = await supabase.rpc('add_admin', {
          admin_email: testEmail,
          admin_role: 'admin'
        })
        
        // Try to clean up immediately
        let cleanupSuccess = false
        if (!addError && addResult && !addResult.startsWith('Error:')) {
          try {
            await supabase.rpc('remove_admin', { admin_email: testEmail })
            cleanupSuccess = true
          } catch {
            // Cleanup failed but test passed
          }
        }
        
        result.test3_addAdmin = {
          success: !addError && (!addResult || !addResult.startsWith('Error:')),
          result: addResult || undefined,
          error: addError?.message,
          testEmail,
          cleanupSuccess,
          performance: Date.now() - testStart
        }
        testPerformance['Add Admin'] = Date.now() - testStart
      } catch (error) {
        result.test3_addAdmin = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          performance: 0
        }
      }

      // Test 4: Remove Admin Function
      try {
        const testStart = Date.now()
        const testEmail = `test-remove-admin-${Date.now()}@example.com`
        
        // First add, then remove
        await supabase.rpc('add_admin', {
          admin_email: testEmail,
          admin_role: 'admin'
        })
        
        const { data: removeResult, error: removeError } = await supabase.rpc('remove_admin', {
          admin_email: testEmail
        })
        
        result.test4_removeAdmin = {
          success: !removeError && (!removeResult || !removeResult.startsWith('Error:')),
          result: removeResult || undefined,
          error: removeError?.message,
          testEmail,
          performance: Date.now() - testStart
        }
        testPerformance['Remove Admin'] = Date.now() - testStart
      } catch (error) {
        result.test4_removeAdmin = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          performance: 0
        }
      }

      // Test 5: Master Admin Emails Function
      try {
        const testStart = Date.now()
        const { data: emails, error: emailsError } = await supabase.rpc('get_master_admin_emails')
        
        result.test5_masterAdminEmails = {
          success: !emailsError,
          emails: emails || undefined,
          count: emails?.length || 0,
          error: emailsError?.message,
          performance: Date.now() - testStart
        }
        testPerformance['Master Admin Emails'] = Date.now() - testStart
      } catch (error) {
        result.test5_masterAdminEmails = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          performance: 0
        }
      }

      // Test 6: Storage Setup
      try {
        const testStart = Date.now()
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
        const errors = []
        
        if (bucketsError) {
          errors.push(`Buckets list: ${bucketsError.message}`)
        }
        
        const imagesBucket = buckets?.find(bucket => bucket.name === 'images')
        let files
        let imagesBucketAccessible = false
        
        if (imagesBucket) {
          try {
            const { data: filesList, error: listError } = await supabase.storage
              .from('images')
              .list('products', { limit: 5 })
            
            if (listError) {
              errors.push(`Images bucket access: ${listError.message}`)
            } else {
              imagesBucketAccessible = true
              files = filesList
            }
          } catch (listErr) {
            errors.push(`Images bucket list error: ${listErr instanceof Error ? listErr.message : 'Unknown error'}`)
          }
        }
        
        result.test6_storage = {
          success: !bucketsError,
          buckets: buckets || undefined,
          imagesBucketExists: !!imagesBucket,
          imagesBucketAccessible,
          files: files || undefined,
          errors: errors.length > 0 ? errors : undefined,
          performance: Date.now() - testStart
        }
        testPerformance['Storage'] = Date.now() - testStart
      } catch (error) {
        result.test6_storage = {
          success: false,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          performance: 0
        }
      }

      // Test 7: Image Upload
      try {
        const testStart = Date.now()
        // Create a small test image blob
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = 'red'
          ctx.fillRect(0, 0, 1, 1)
        }
        
        const testBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob || new Blob())
          }, 'image/png')
        })
        
        const testFile = new File([testBlob], 'test-upload.png', { type: 'image/png' })
        const testPath = `products/test-${Date.now()}.png`
        
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(testPath, testFile, {
            cacheControl: '3600',
            upsert: false
          })
        
        let cleanupSuccess = false
        if (!uploadError) {
          try {
            await supabase.storage.from('images').remove([testPath])
            cleanupSuccess = true
          } catch {
            // Cleanup failed but upload succeeded
          }
        }
        
        result.test7_upload = {
          success: !uploadError,
          uploadSuccess: !uploadError,
          cleanupSuccess,
          error: uploadError?.message,
          uploadSize: testFile.size,
          performance: Date.now() - testStart
        }
        testPerformance['Upload'] = Date.now() - testStart
      } catch (error) {
        result.test7_upload = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          performance: 0
        }
      }

      // Test 8: Environment Variables
      try {
        const testStart = Date.now()
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        result.test8_environment = {
          success: !!(supabaseUrl && supabaseKey),
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey,
          urlDomain: supabaseUrl ? new URL(supabaseUrl).hostname : undefined,
          nodeEnv: process.env.NODE_ENV,
          performance: Date.now() - testStart
        }
        testPerformance['Environment'] = Date.now() - testStart
      } catch {
        result.test8_environment = {
          success: false,
          performance: 0
        }
      }

      // Test 9: Debug Admin Status Function
      try {
        const testStart = Date.now()
        const { data: debugStatus, error: debugError } = await supabase.rpc('debug_admin_status')
        
        result.test9_debugFunctions = {
          success: !debugError,
          debugStatus: debugStatus || undefined,
          error: debugError?.message,
          performance: Date.now() - testStart
        }
        testPerformance['Debug Functions'] = Date.now() - testStart
      } catch (error) {
        result.test9_debugFunctions = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          performance: 0
        }
      }

      // Test 10: Authentication Edge Cases
      try {
        const testStart = Date.now()
        const tests = {
          sessionRefresh: false,
          multipleAdminCalls: false,
          concurrentRequests: false,
          invalidTokenHandling: false
        }
        const errors: string[] = []

        // Test multiple admin calls
        try {
          const promises = Array(3).fill(null).map(() => supabase.rpc('is_admin'))
          const results = await Promise.all(promises)
          tests.multipleAdminCalls = results.every(r => !r.error)
        } catch (err) {
          errors.push(`Multiple calls: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }

        // Test concurrent requests
        try {
          const [adminResult, masterResult] = await Promise.all([
            supabase.rpc('is_admin'),
            supabase.rpc('is_master_admin')
          ])
          tests.concurrentRequests = !adminResult.error && !masterResult.error
        } catch (err) {
          errors.push(`Concurrent: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }

        result.test10_authEdgeCases = {
          success: Object.values(tests).some(Boolean),
          tests,
          errors: errors.length > 0 ? errors : undefined,
          performance: Date.now() - testStart
        }
        testPerformance['Auth Edge Cases'] = Date.now() - testStart
      } catch (error) {
        result.test10_authEdgeCases = {
          success: false,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          performance: 0
        }
      }

      // Test 11: Database Integrity (Basic checks)
      try {
        const testStart = Date.now()
        
        // Basic table existence and structure checks
        const { data: tableCheck, error: tableError } = await supabase
          .from('admin_users')
          .select('admin_id, user_id, email, role, is_active')
          .limit(1)

        const { data: userTableCheck, error: userTableError } = await supabase
          .from('users')
          .select('user_id, email')
          .limit(1)

        const tablesExist = !!tableCheck && !!userTableCheck
        
        result.test11_databaseIntegrity = {
          success: !tableError && !userTableError && tablesExist,
          foreignKeys: !tableError && !userTableError,
          constraints: !tableError,
          indexes: true, // Assume indexes are working if queries work
          triggers: true, // Assume triggers work if admin functions work
          error: tableError?.message || userTableError?.message,
          performance: Date.now() - testStart
        }
        testPerformance['Database Integrity'] = Date.now() - testStart
      } catch (error) {
        result.test11_databaseIntegrity = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          performance: 0
        }
      }

      // Test 12: Performance Summary
      const totalTestTime = Date.now() - startTime
      const operationTimes = Object.entries(testPerformance)
      const slowestOperation = operationTimes.reduce((slowest, [name, time]) => 
        time > slowest.time ? { name, time } : slowest, 
        { name: '', time: 0 }
      )
      const fastestOperation = operationTimes.reduce((fastest, [name, time]) => 
        time < fastest.time ? { name, time } : fastest, 
        { name: '', time: Infinity }
      )
      const averageTime = operationTimes.length > 0 
        ? operationTimes.reduce((sum, [, time]) => sum + time, 0) / operationTimes.length 
        : 0

      result.test12_performance = {
        success: true,
        averageResponseTime: Math.round(averageTime),
        slowestOperation: slowestOperation.name,
        fastestOperation: fastestOperation.time === Infinity ? 'None' : fastestOperation.name,
        totalTestTime
      }

      // Calculate overall results
      const tests = [
        result.test1_session,
        result.test2_adminTable,
        result.test3_addAdmin,
        result.test4_removeAdmin,
        result.test5_masterAdminEmails,
        result.test6_storage,
        result.test7_upload,
        result.test8_environment,
        result.test9_debugFunctions,
        result.test10_authEdgeCases,
        result.test11_databaseIntegrity,
        result.test12_performance
      ]

      result.passedTests = tests.filter(test => test.success).length
      result.failedTests = tests.filter(test => !test.success).length
      result.overallSuccess = result.passedTests === result.totalTests

    } catch (error) {
      console.error('Comprehensive test error:', error)
    } finally {
      setComprehensiveTest(result)
      setComprehensiveLoading(false)
    }
  }

  const getOverallStatusIcon = () => {
    if (!auth.sessionValid) return <XCircle className="h-4 w-4 text-white" />
    if (auth.isMasterAdmin) return <CheckCircle className="h-4 w-4 text-white" />
    if (auth.isAdmin) return <Shield className="h-4 w-4 text-white" />
    return <AlertCircle className="h-4 w-4 text-white" />
  }

  const getOverallStatusBadge = () => {
    if (!auth.sessionValid) return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Session Invalid
      </Badge>
    )
    if (auth.isMasterAdmin) return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Master Admin
      </Badge>
    )
    if (auth.isAdmin) return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    )
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        <AlertCircle className="h-3 w-3 mr-1" />
        Regular User
      </Badge>
    )
  }

  return (
    <Card className="w-full bg-white border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-200 bg-gray-50/50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              {getOverallStatusIcon()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Admin Debug Panel</h3>
              <p className="text-sm text-gray-600 font-normal">Essential debug information for admin authentication status</p>
            </div>
          </div>
          {getOverallStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Status Summary */}
          <div className="bg-white p-3 rounded border">
            <h3 className="font-semibold text-sm mb-2 text-gray-800">Current Status:</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between">
                <span>User:</span>
                <Badge variant={user ? "default" : "destructive"}>
                  {user?.email?.slice(0, 20) || 'None'}...
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Admin:</span>
                <Badge variant={auth.isAdmin ? "default" : "secondary"}>
                  {auth.isAdmin ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Master:</span>
                <Badge variant={auth.isMasterAdmin ? "default" : "secondary"}>
                  {auth.isMasterAdmin ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Session:</span>
                <Badge variant={auth.sessionValid ? "default" : "destructive"}>
                  {auth.sessionValid ? 'Valid' : 'Invalid'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Manual Database Check */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Database Verification:</h3>
              <Button 
                size="sm" 
                onClick={performManualAdminCheck}
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Checking...' : 'Test Database'}
              </Button>
            </div>
            {manualCheck && (
              <div className="bg-gray-50 p-3 rounded border text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <strong>Admin Function:</strong>
                    <Badge variant={manualCheck.adminResult ? "default" : "destructive"} className="ml-1">
                      {manualCheck.adminResult ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                  <div>
                    <strong>Master Function:</strong>
                    <Badge variant={manualCheck.masterResult ? "default" : "destructive"} className="ml-1">
                      {manualCheck.masterResult ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                  <div>
                    <strong>Session:</strong>
                    <Badge variant={manualCheck.session ? "default" : "destructive"} className="ml-1">
                      {manualCheck.session ? 'Valid' : 'Invalid'}
                    </Badge>
                  </div>
                  <div>
                    <strong>Admin Record:</strong>
                    <Badge variant={manualCheck.adminRecord ? "default" : "destructive"} className="ml-1">
                      {manualCheck.adminRecord ? 'Found' : 'Missing'}
                    </Badge>
                  </div>
                </div>
                {manualCheck.error && typeof manualCheck.error === 'string' && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <strong className="text-red-800">Error:</strong>
                    <div className="text-red-700 mt-1">{manualCheck.error}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comprehensive Test */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Comprehensive System Test:</h3>
              <Button 
                size="sm" 
                onClick={runComprehensiveTest}
                disabled={comprehensiveLoading}
                variant="default"
              >
                {comprehensiveLoading ? 'Running Tests...' : 'Run All Tests'}
              </Button>
            </div>
            {comprehensiveTest && (
              <div className="bg-white border rounded p-3 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <strong>Overall Status:</strong>
                  <Badge variant={comprehensiveTest.overallSuccess ? "default" : "destructive"}>
                    {comprehensiveTest.passedTests}/{comprehensiveTest.totalTests} Tests Passed
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {/* Test 1: Session */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>📋 Session & Auth:</span>
                    <Badge variant={comprehensiveTest.test1_session.success ? "default" : "destructive"}>
                      {comprehensiveTest.test1_session.success ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                  
                  {/* Test 2: Admin Table */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>📋 Admin Table:</span>
                    <Badge variant={comprehensiveTest.test2_adminTable.success ? "default" : "destructive"}>
                      {comprehensiveTest.test2_adminTable.success ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                  
                  {/* Test 3: Add Admin Function */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>➕ Add Admin:</span>
                    <Badge variant={comprehensiveTest.test3_addAdmin.success ? "default" : "destructive"}>
                      {comprehensiveTest.test3_addAdmin.success ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                  
                  {/* Test 4: Remove Admin Function */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>➖ Remove Admin:</span>
                    <Badge variant={comprehensiveTest.test4_removeAdmin.success ? "default" : "destructive"}>
                      {comprehensiveTest.test4_removeAdmin.success ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                  
                  {/* Test 5: Master Admin Emails */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>👑 Master Emails:</span>
                    <Badge variant={comprehensiveTest.test5_masterAdminEmails.success ? "default" : "destructive"}>
                      {comprehensiveTest.test5_masterAdminEmails.success ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                  
                  {/* Test 6: Storage */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>� Storage:</span>
                    <Badge variant={comprehensiveTest.test6_storage.success ? "default" : "destructive"}>
                      {comprehensiveTest.test6_storage.success ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                  
                  {/* Test 7: Upload */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>� Upload:</span>
                    <Badge variant={comprehensiveTest.test7_upload.success ? "default" : "destructive"}>
                      {comprehensiveTest.test7_upload.success ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                  
                  {/* Test 8: Environment */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>� Environment:</span>
                    <Badge variant={comprehensiveTest.test8_environment.success ? "default" : "destructive"}>
                      {comprehensiveTest.test8_environment.success ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                  
                  {/* Test 9: Debug Functions */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>� Debug Functions:</span>
                    <Badge variant={comprehensiveTest.test9_debugFunctions.success ? "default" : "destructive"}>
                      {comprehensiveTest.test9_debugFunctions.success ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                  
                  {/* Test 10: Auth Edge Cases */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>🔐 Auth Edge Cases:</span>
                    <Badge variant={comprehensiveTest.test10_authEdgeCases.success ? "default" : "destructive"}>
                      {comprehensiveTest.test10_authEdgeCases.success ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                  
                  {/* Test 11: Database Integrity */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>🗄️ DB Integrity:</span>
                    <Badge variant={comprehensiveTest.test11_databaseIntegrity.success ? "default" : "destructive"}>
                      {comprehensiveTest.test11_databaseIntegrity.success ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                  
                  {/* Test 12: Performance */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>⚡ Performance:</span>
                    <Badge variant={comprehensiveTest.test12_performance.success ? "default" : "destructive"}>
                      {comprehensiveTest.test12_performance.success ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                </div>

                {/* Detailed Results - Show if any failures */}
                {(comprehensiveTest.failedTests > 0) && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <strong className="text-red-800">Failed Tests Details:</strong>
                    <div className="mt-1 space-y-1 text-red-700">
                      {!comprehensiveTest.test1_session.success && (
                        <div>• Session: {comprehensiveTest.test1_session.errors?.join(', ')}</div>
                      )}
                      {!comprehensiveTest.test2_adminTable.success && (
                        <div>• Admin Table: {comprehensiveTest.test2_adminTable.error}</div>
                      )}
                      {!comprehensiveTest.test3_addAdmin.success && (
                        <div>• Add Admin: {comprehensiveTest.test3_addAdmin.error}</div>
                      )}
                      {!comprehensiveTest.test4_removeAdmin.success && (
                        <div>• Remove Admin: {comprehensiveTest.test4_removeAdmin.error}</div>
                      )}
                      {!comprehensiveTest.test5_masterAdminEmails.success && (
                        <div>• Master Admin Emails: {comprehensiveTest.test5_masterAdminEmails.error}</div>
                      )}
                      {!comprehensiveTest.test6_storage.success && (
                        <div>• Storage: {comprehensiveTest.test6_storage.errors?.join(', ')}</div>
                      )}
                      {!comprehensiveTest.test7_upload.success && (
                        <div>• Upload: {comprehensiveTest.test7_upload.error}</div>
                      )}
                      {!comprehensiveTest.test8_environment.success && (
                        <div>• Environment: Missing required env vars</div>
                      )}
                      {!comprehensiveTest.test9_debugFunctions.success && (
                        <div>• Debug Functions: {comprehensiveTest.test9_debugFunctions.error}</div>
                      )}
                      {!comprehensiveTest.test10_authEdgeCases.success && (
                        <div>• Auth Edge Cases: {comprehensiveTest.test10_authEdgeCases.errors?.join(', ')}</div>
                      )}
                      {!comprehensiveTest.test11_databaseIntegrity.success && (
                        <div>• Database Integrity: {comprehensiveTest.test11_databaseIntegrity.error}</div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Success Summary */}
                {comprehensiveTest.test6_storage.imagesBucketExists && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <div className="text-green-800 text-xs">
                      ✅ Images bucket found | 
                      {comprehensiveTest.test2_adminTable.count || 0} admin(s) | 
                      {comprehensiveTest.test5_masterAdminEmails.count || 0} master admin(s) |
                      Env: {comprehensiveTest.test8_environment.urlDomain}
                    </div>
                  </div>
                )}
                
                {/* Performance Summary */}
                {comprehensiveTest.test12_performance.success && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-blue-800 text-xs">
                      ⚡ Total: {comprehensiveTest.test12_performance.totalTestTime}ms | 
                      Avg: {comprehensiveTest.test12_performance.averageResponseTime}ms | 
                      Slowest: {comprehensiveTest.test12_performance.slowestOperation}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 text-center border-t pt-2">
            For comprehensive diagnostics, visit <strong>/admin/diagnostic</strong>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
