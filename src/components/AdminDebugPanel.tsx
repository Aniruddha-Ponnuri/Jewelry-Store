'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { getCachedAdminStatus, clearAdminCache } from '@/lib/adminSession'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AdminDebugInfo {
  userId: string | null
  sessionExists: boolean
  sessionValid: boolean
  isAdminFromContext: boolean
  isAdminFromDb: boolean | null
  cachedAdminStatus: boolean | null
  adminDbRecord: any
  sessionInfo: any
  errors: string[]
}

export default function AdminDebugPanel() {
  const { user, isAdmin: contextIsAdmin, loading } = useAuth()
  const [debugInfo, setDebugInfo] = useState<AdminDebugInfo | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const collectDebugInfo = async () => {
    if (!user) {
      setDebugInfo(null)
      return
    }

    const info: AdminDebugInfo = {
      userId: user.id,
      sessionExists: false,
      sessionValid: false,
      isAdminFromContext: contextIsAdmin,
      isAdminFromDb: null,
      cachedAdminStatus: null,
      adminDbRecord: null,
      sessionInfo: null,
      errors: []
    }

    try {
      const supabase = createClient()

      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        info.errors.push(`Session error: ${sessionError.message}`)
      } else if (session) {
        info.sessionExists = true
        info.sessionValid = session.user?.id === user.id
        info.sessionInfo = {
          accessToken: session.access_token ? 'present' : 'missing',
          refreshToken: session.refresh_token ? 'present' : 'missing',
          expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown',
          userId: session.user?.id
        }
      }

      // Check cached admin status
      info.cachedAdminStatus = getCachedAdminStatus(user.id)

      // Check admin status from database
      try {
        const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin')
        if (adminError) {
          info.errors.push(`Admin check error: ${adminError.message}`)
        } else {
          info.isAdminFromDb = Boolean(adminCheck)
        }
      } catch (error) {
        info.errors.push(`Admin check exception: ${error}`)
      }

      // Get admin record from database
      try {
        const { data: adminRecord, error: recordError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (recordError && recordError.code !== 'PGRST116') {
          info.errors.push(`Admin record error: ${recordError.message}`)
        } else {
          info.adminDbRecord = adminRecord
        }
      } catch (error) {
        info.errors.push(`Admin record exception: ${error}`)
      }

    } catch (error) {
      info.errors.push(`General error: ${error}`)
    }

    setDebugInfo(info)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    clearAdminCache()
    await collectDebugInfo()
    setRefreshing(false)
  }

  useEffect(() => {
    if (user && !loading) {
      collectDebugInfo()
    }
  }, [user, loading, contextIsAdmin])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Debug Panel</CardTitle>
          <CardDescription>Loading authentication state...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Debug Panel</CardTitle>
          <CardDescription>No user logged in</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Debug Panel</CardTitle>
        <CardDescription>Debug information for admin status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handleRefresh} disabled={refreshing} size="sm">
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={clearAdminCache} variant="outline" size="sm">
            Clear Cache
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">User Information</h4>
              <div className="text-sm space-y-1">
                <p><strong>User ID:</strong> {debugInfo.userId}</p>
                <p><strong>Email:</strong> {user.email}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Session Status</h4>
              <div className="flex gap-2 mb-2">
                <Badge variant={debugInfo.sessionExists ? "default" : "destructive"}>
                  Session {debugInfo.sessionExists ? 'Exists' : 'Missing'}
                </Badge>
                <Badge variant={debugInfo.sessionValid ? "default" : "destructive"}>
                  Session {debugInfo.sessionValid ? 'Valid' : 'Invalid'}
                </Badge>
              </div>
              {debugInfo.sessionInfo && (
                <div className="text-sm space-y-1">
                  <p><strong>Access Token:</strong> {debugInfo.sessionInfo.accessToken}</p>
                  <p><strong>Refresh Token:</strong> {debugInfo.sessionInfo.refreshToken}</p>
                  <p><strong>Expires At:</strong> {debugInfo.sessionInfo.expiresAt}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-2">Admin Status</h4>
              <div className="flex gap-2 mb-2">
                <Badge variant={debugInfo.isAdminFromContext ? "default" : "secondary"}>
                  Context: {debugInfo.isAdminFromContext ? 'Admin' : 'Not Admin'}
                </Badge>
                <Badge variant={debugInfo.isAdminFromDb ? "default" : "secondary"}>
                  Database: {debugInfo.isAdminFromDb === null ? 'Unknown' : (debugInfo.isAdminFromDb ? 'Admin' : 'Not Admin')}
                </Badge>
                <Badge variant={debugInfo.cachedAdminStatus ? "default" : "secondary"}>
                  Cached: {debugInfo.cachedAdminStatus === null ? 'No Cache' : (debugInfo.cachedAdminStatus ? 'Admin' : 'Not Admin')}
                </Badge>
              </div>
            </div>

            {debugInfo.adminDbRecord && (
              <div>
                <h4 className="font-semibold mb-2">Admin Record</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Role:</strong> {debugInfo.adminDbRecord.role}</p>
                  <p><strong>Active:</strong> {debugInfo.adminDbRecord.is_active ? 'Yes' : 'No'}</p>
                  <p><strong>Created:</strong> {new Date(debugInfo.adminDbRecord.created_at).toLocaleString()}</p>
                </div>
              </div>
            )}

            {debugInfo.errors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-red-600">Errors</h4>
                <div className="space-y-1">
                  {debugInfo.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600">{error}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
