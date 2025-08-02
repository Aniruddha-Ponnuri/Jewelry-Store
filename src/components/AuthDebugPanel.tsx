'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSessionDebugInfo, clearInvalidSession } from '@/lib/sessionUtils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SessionInfo {
  hasSession: boolean
  hasUser: boolean
  userEmail?: string
  expiresAt?: string | null
  hasAccessToken: boolean
  hasRefreshToken: boolean
  error?: string
}

export default function AuthDebugPanel() {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [storageAccess, setStorageAccess] = useState<boolean | null>(null)
  const [buckets, setBuckets] = useState<string[]>([])
  const supabase = createClient()

  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      setSessionInfo({
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        hasAccessToken: !!session?.access_token,
        hasRefreshToken: !!session?.refresh_token,
        error: error?.message
      })
    } catch (err) {
      setSessionInfo({ 
        hasSession: false,
        hasUser: false,
        hasAccessToken: false,
        hasRefreshToken: false,
        error: err instanceof Error ? err.message : 'Unknown error' 
      })
    }
  }, [supabase])

  const checkStorageAccess = useCallback(async () => {
    try {
      const { data: bucketList, error } = await supabase.storage.listBuckets()
      if (error) {
        setStorageAccess(false)
        console.error('Storage error:', error)
      } else {
        setStorageAccess(true)
        setBuckets(bucketList?.map(b => b.name) || [])
      }
    } catch (err) {
      setStorageAccess(false)
      console.error('Storage access error:', err)
    }
  }, [supabase])

  useEffect(() => {
    checkSession()
    checkStorageAccess()
  }, [checkSession, checkStorageAccess])

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>🔧 Auth Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Session Info:</h3>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Storage Access:</h3>
          <p className={`text-sm ${storageAccess ? 'text-green-600' : 'text-red-600'}`}>
            {storageAccess === null ? 'Checking...' : storageAccess ? 'Available' : 'Failed'}
          </p>
          {buckets.length > 0 && (
            <p className="text-sm text-gray-600">
              Buckets: {buckets.join(', ')}
            </p>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={checkSession} variant="outline" size="sm">
            Refresh Session
          </Button>
          <Button onClick={checkStorageAccess} variant="outline" size="sm">
            Test Storage
          </Button>
          <Button onClick={logSessionDebugInfo} variant="outline" size="sm">
            Log Debug Info
          </Button>
          <Button 
            onClick={() => {
              clearInvalidSession()
              window.location.reload()
            }} 
            variant="destructive" 
            size="sm"
          >
            Clear Session & Reload
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
