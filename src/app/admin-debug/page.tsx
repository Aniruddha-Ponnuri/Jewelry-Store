'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface DebugInfo {
  user_id: string | null
  is_admin_function_result: boolean | null
  total_active_admins: number
  user_admin_record_exists: boolean
  user_admin_is_active: boolean | null
  admin_email: string | null
  timestamp: string
  error?: boolean
  message?: string
}

export default function AdminDebugPage() {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const runDebugCheck = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.rpc('debug_admin_status')
      
      if (error) {
        setError(`Debug function error: ${error.message}`)
        return
      }
      
      setDebugInfo(data)
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (user) {
      runDebugCheck()
    }
  }, [user, runDebugCheck])

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    return status ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />
  }

  const getStatusBadge = (status: boolean | null, trueText: string, falseText: string, nullText: string = 'Unknown') => {
    if (status === null) return <Badge variant="secondary">{nullText}</Badge>
    return status ? 
      <Badge variant="default" className="bg-green-600">{trueText}</Badge> : 
      <Badge variant="destructive">{falseText}</Badge>
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Admin Debug Tool</CardTitle>
            <CardDescription>You must be logged in to use this tool</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please log in to check your admin status.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Debug Tool</h1>
          <p className="text-muted-foreground">Diagnose admin authentication issues</p>
        </div>
        <Button onClick={runDebugCheck} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span>User ID:</span>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{user.id}</code>
          </div>
          <div className="flex items-center justify-between">
            <span>Email:</span>
            <span>{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Environment:</span>
            <Badge variant="outline">
              {process.env.NODE_ENV === 'production' ? 'Production (Vercel)' : 'Development'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Debug Results */}
      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Status Debug Results</CardTitle>
            <CardDescription>
              Last updated: {new Date(debugInfo.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {debugInfo.error ? (
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>
                  Debug function error: {debugInfo.message}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(debugInfo.is_admin_function_result)}
                      <span className="font-medium">is_admin() Function</span>
                    </div>
                    {getStatusBadge(debugInfo.is_admin_function_result, 'Admin', 'Not Admin')}
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(debugInfo.user_admin_record_exists)}
                      <span className="font-medium">Admin Record Exists</span>
                    </div>
                    {getStatusBadge(debugInfo.user_admin_record_exists, 'Exists', 'Not Found')}
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(debugInfo.user_admin_is_active)}
                      <span className="font-medium">Admin Record Active</span>
                    </div>
                    {getStatusBadge(debugInfo.user_admin_is_active, 'Active', 'Inactive')}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">Total Active Admins</div>
                    <div className="text-2xl font-bold text-blue-600">{debugInfo.total_active_admins}</div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">Admin Email</div>
                    <div className="text-sm">
                      {debugInfo.admin_email || 'Not registered as admin'}
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">User ID Match</div>
                    <div className="text-xs text-muted-foreground">
                      {debugInfo.user_id === user.id ? '✅ Match' : '❌ Mismatch'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">If admin functions are not working on Vercel:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Ensure you&apos;ve run the <code>vercel-admin-fix.sql</code> script on your production database</li>
              <li>Check that your user account is properly registered in the <code>admin_users</code> table</li>
              <li>Verify that RLS policies are correctly set up</li>
              <li>Make sure the <code>is_admin()</code> function returns true for your user</li>
              <li>Check browser console for any JavaScript errors</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Common issues:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Function not found:</strong> Admin functions may not be deployed to production</li>
              <li><strong>Permission denied:</strong> RLS policies may be blocking access</li>
              <li><strong>No admin record:</strong> User may not be added to admin_users table</li>
              <li><strong>Inactive admin:</strong> Admin record exists but is_active = false</li>
            </ul>
          </div>

          {debugInfo && !debugInfo.error && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                {debugInfo.is_admin_function_result ? (
                  <span className="text-green-700">✅ Admin authentication is working correctly!</span>
                ) : debugInfo.user_admin_record_exists ? (
                  <span className="text-red-700">❌ Admin record exists but is_admin() returns false. Check if record is active.</span>
                ) : (
                  <span className="text-red-700">❌ No admin record found. Use add_admin() function to create one.</span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
