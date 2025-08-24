'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSessionDebugInfo, clearInvalidSession } from '@/lib/sessionUtils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Database, Shield, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

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

  const getSessionStatusIcon = () => {
    if (sessionInfo?.error) return <XCircle className="h-4 w-4 text-white" />
    if (sessionInfo?.hasSession) return <CheckCircle className="h-4 w-4 text-white" />
    return <AlertCircle className="h-4 w-4 text-white" />
  }

  const getSessionStatusBadge = () => {
    if (sessionInfo?.error) return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Session Error
      </Badge>
    )
    if (sessionInfo?.hasSession) return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active Session
      </Badge>
    )
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        <AlertCircle className="h-3 w-3 mr-1" />
        No Session
      </Badge>
    )
  }

  const getStorageStatusBadge = () => {
    if (storageAccess === null) return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
        Checking...
      </Badge>
    )
    if (storageAccess) return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Storage Available
      </Badge>
    )
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Storage Failed
      </Badge>
    )
  }

  return (
    <Card className="w-full bg-white border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-200 bg-gray-50/50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              {getSessionStatusIcon()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Authentication Debug Panel</h3>
              <p className="text-sm text-gray-600 font-normal">Detailed session and storage analysis</p>
            </div>
          </div>
          {getSessionStatusBadge()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Session Information */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-4 h-4" />
                Session Information
              </h4>
            </div>
            <div className="p-4">
              {sessionInfo ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Session:</span>
                      <Badge variant={sessionInfo.hasSession ? "default" : "secondary"}>
                        {sessionInfo.hasSession ? "✅ Active" : "❌ None"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">User:</span>
                      <Badge variant={sessionInfo.hasUser ? "default" : "secondary"}>
                        {sessionInfo.hasUser ? "✅ Valid" : "❌ Missing"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Access Token:</span>
                      <Badge variant={sessionInfo.hasAccessToken ? "default" : "secondary"}>
                        {sessionInfo.hasAccessToken ? "✅ Present" : "❌ Missing"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Refresh Token:</span>
                      <Badge variant={sessionInfo.hasRefreshToken ? "default" : "secondary"}>
                        {sessionInfo.hasRefreshToken ? "✅ Present" : "❌ Missing"}
                      </Badge>
                    </div>
                  </div>
                  
                  {sessionInfo.userEmail && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {sessionInfo.userEmail}
                      </p>
                    </div>
                  )}
                  
                  {sessionInfo.expiresAt && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Expires:</span> {new Date(sessionInfo.expiresAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  {sessionInfo.error && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-sm text-red-600">
                        <span className="font-medium">Error:</span> {sessionInfo.error}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Loading session information...</p>
              )}
            </div>
          </div>

          {/* Storage Access */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Storage Access
              </h4>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                {getStorageStatusBadge()}
              </div>
              
              {buckets.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Available Buckets ({buckets.length}):</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {buckets.map((bucket, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {bucket}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={checkSession} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Session
            </Button>
            
            <Button 
              onClick={checkStorageAccess} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Test Storage
            </Button>
            
            <Button 
              onClick={logSessionDebugInfo} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Log Debug Info
            </Button>
            
            <Button 
              onClick={() => {
                clearInvalidSession()
                window.location.reload()
              }} 
              variant="destructive" 
              size="sm"
              className="flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Clear Session & Reload
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
