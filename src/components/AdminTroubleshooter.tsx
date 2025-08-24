'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Wrench } from 'lucide-react'

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: unknown
}

export default function AdminTroubleshooter() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    setResults([])
    const diagnostics: DiagnosticResult[] = []
    const supabase = createClient()

    // Test 1: Session Check
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        diagnostics.push({
          test: 'Session Check',
          status: 'error',
          message: `Session error: ${sessionError.message}`,
          details: sessionError
        })
      } else if (!session) {
        diagnostics.push({
          test: 'Session Check',
          status: 'error',
          message: 'No active session found'
        })
      } else {
        diagnostics.push({
          test: 'Session Check',
          status: 'success',
          message: `Session valid for ${session.user.email}`,
          details: {
            userId: session.user.id,
            expiresAt: new Date(session.expires_at! * 1000).toISOString()
          }
        })
      }
    } catch (error) {
      diagnostics.push({
        test: 'Session Check',
        status: 'error',
        message: `Unexpected error: ${error}`,
        details: error
      })
    }

    // Test 2: Admin Functions Check
    try {
      const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin')
      
      if (adminError) {
        diagnostics.push({
          test: 'Admin Functions',
          status: 'error',
          message: `Admin function error: ${adminError.message}`,
          details: adminError
        })
      } else {
        diagnostics.push({
          test: 'Admin Functions',
          status: 'success',
          message: `Admin functions working. Current user is ${isAdminResult ? 'an admin' : 'not an admin'}`,
          details: { isAdmin: isAdminResult }
        })
      }
    } catch (error) {
      diagnostics.push({
        test: 'Admin Functions',
        status: 'error',
        message: `Function call failed: ${error}`,
        details: error
      })
    }

    // Test 3: Master Admin Check
    try {
      const { data: isMasterResult, error: masterError } = await supabase.rpc('is_master_admin')
      
      if (masterError) {
        diagnostics.push({
          test: 'Master Admin Functions',
          status: 'error',
          message: `Master admin function error: ${masterError.message}`,
          details: masterError
        })
      } else {
        diagnostics.push({
          test: 'Master Admin Functions',
          status: 'success',
          message: `Master admin functions working. Current user is ${isMasterResult ? 'a master admin' : 'not a master admin'}`,
          details: { isMasterAdmin: isMasterResult }
        })
      }
    } catch (error) {
      diagnostics.push({
        test: 'Master Admin Functions',
        status: 'error',
        message: `Function call failed: ${error}`,
        details: error
      })
    }

    // Test 4: Admin Users Table Access
    try {
      const { data: adminUsers, error: tableError } = await supabase
        .from('admin_users')
        .select('count')
        .limit(1)
      
      if (tableError) {
        diagnostics.push({
          test: 'Admin Users Table',
          status: 'error',
          message: `Table access error: ${tableError.message}`,
          details: tableError
        })
      } else {
        diagnostics.push({
          test: 'Admin Users Table',
          status: 'success',
          message: 'Admin users table accessible',
          details: adminUsers
        })
      }
    } catch (error) {
      diagnostics.push({
        test: 'Admin Users Table',
        status: 'error',
        message: `Table query failed: ${error}`,
        details: error
      })
    }

    // Test 5: Storage Buckets Check
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        diagnostics.push({
          test: 'Storage Buckets',
          status: 'error',
          message: `Storage error: ${bucketsError.message}`,
          details: bucketsError
        })
      } else {
        const imagesBucket = buckets.find(b => b.name === 'images')
        if (imagesBucket) {
          diagnostics.push({
            test: 'Storage Buckets',
            status: 'success',
            message: 'Images bucket found and accessible',
            details: { buckets: buckets.map(b => b.name) }
          })
        } else {
          diagnostics.push({
            test: 'Storage Buckets',
            status: 'warning',
            message: 'Images bucket not found - image uploads will fail',
            details: { availableBuckets: buckets.map(b => b.name) }
          })
        }
      }
    } catch (error) {
      diagnostics.push({
        test: 'Storage Buckets',
        status: 'error',
        message: `Storage check failed: ${error}`,
        details: error
      })
    }

    // Test 6: Add Admin Function Test
    try {
      // Test with invalid email to check function response
      const { data: addResult, error: addError } = await supabase.rpc('add_admin', {
        admin_email: 'nonexistent@test.com',
        admin_role: 'admin'
      })
      
      if (addError) {
        diagnostics.push({
          test: 'Add Admin Function',
          status: 'error',
          message: `Add admin function error: ${addError.message}`,
          details: addError
        })
      } else if (addResult && addResult.includes('not found')) {
        diagnostics.push({
          test: 'Add Admin Function',
          status: 'success',
          message: 'Add admin function working correctly (expected error for non-existent user)',
          details: { response: addResult }
        })
      } else {
        diagnostics.push({
          test: 'Add Admin Function',
          status: 'warning',
          message: 'Add admin function response unexpected',
          details: { response: addResult }
        })
      }
    } catch (error) {
      diagnostics.push({
        test: 'Add Admin Function',
        status: 'error',
        message: `Function test failed: ${error}`,
        details: error
      })
    }

    setResults(diagnostics)
    setIsRunning(false)
  }

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    }
  }

  const getOverallStatusIcon = () => {
    const errorCount = results.filter(r => r.status === 'error').length
    const warningCount = results.filter(r => r.status === 'warning').length
    
    if (errorCount > 0) return <XCircle className="h-4 w-4 text-white" />
    if (warningCount > 0) return <AlertTriangle className="h-4 w-4 text-white" />
    if (results.length > 0) return <CheckCircle className="h-4 w-4 text-white" />
    return <Wrench className="h-4 w-4 text-white" />
  }

  const getOverallStatusBadge = () => {
    if (isRunning) return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
        Running...
      </Badge>
    )
    
    const errorCount = results.filter(r => r.status === 'error').length
    const warningCount = results.filter(r => r.status === 'warning').length
    const successCount = results.filter(r => r.status === 'success').length
    
    if (errorCount > 0) return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        {errorCount} Error{errorCount > 1 ? 's' : ''}
      </Badge>
    )
    if (warningCount > 0) return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {warningCount} Warning{warningCount > 1 ? 's' : ''}
      </Badge>
    )
    if (successCount > 0) return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        All Tests Passed
      </Badge>
    )
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        <Wrench className="h-3 w-3 mr-1" />
        Ready to Test
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
              <h3 className="text-lg font-bold text-gray-800">System Troubleshooter</h3>
              <p className="text-sm text-gray-600 font-normal">Run diagnostics to identify admin creation and image upload issues</p>
            </div>
          </div>
          {getOverallStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>

          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Diagnostic Results:</h3>
              {results.map((result, index) => (
                <Alert key={index} className={getStatusColor(result.status)}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{result.test}</span>
                        <Badge variant="outline" className="text-xs">
                          {result.status}
                        </Badge>
                      </div>
                      <AlertDescription>{result.message}</AlertDescription>
                      {result.details ? (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer opacity-70">Details</summary>
                          <pre className="text-xs mt-1 p-2 bg-black/5 rounded overflow-auto">
                            {typeof result.details === 'string' 
                              ? result.details 
                              : JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      ) : null}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {results.some(r => r.status === 'error' && r.test.includes('Admin Functions')) && (
                  <li>• Run the complete database setup SQL script to create admin functions</li>
                )}
                {results.some(r => r.status === 'warning' && r.test.includes('Storage')) && (
                  <li>• Create an &quot;images&quot; bucket in Supabase Storage for image uploads</li>
                )}
                {results.some(r => r.status === 'error' && r.test.includes('Session')) && (
                  <li>• Clear browser localStorage and re-login</li>
                )}
                {results.some(r => r.status === 'error' && r.test.includes('Table')) && (
                  <li>• Check RLS policies on admin_users table</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
