'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/hooks/useAdmin'
import { getCachedAdminStatus, clearAdminCache } from '@/lib/adminSession'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Trash2, Bug } from 'lucide-react'

interface AdminStatusDebugProps {
  minimal?: boolean
}

export default function AdminStatusDebug({ minimal = false }: AdminStatusDebugProps) {
  const { user, isAdmin: contextIsAdmin, loading: authLoading, refreshAdminStatus } = useAuth()
  const { isAdmin: hookIsAdmin, loading: hookLoading } = useAdmin()
  const [refreshing, setRefreshing] = useState(false)
  const [expanded, setExpanded] = useState(!minimal)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshAdminStatus()
    } finally {
      setRefreshing(false)
    }
  }

  const handleClearCache = () => {
    clearAdminCache()
    window.location.reload()
  }

  if (!user) {
    return minimal ? null : (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-800">No user logged in</p>
        </CardContent>
      </Card>
    )
  }

  const cachedStatus = getCachedAdminStatus(user.id)

  if (minimal) {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setExpanded(!expanded)}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <Bug className="w-3 h-3" />
          Debug
        </Button>
        {expanded && (
          <div className="flex items-center gap-2">
            <Badge variant={contextIsAdmin ? "default" : "secondary"}>
              Context: {contextIsAdmin ? 'Admin' : 'Not Admin'}
            </Badge>
            <Badge variant={hookIsAdmin ? "default" : "secondary"}>
              Hook: {hookIsAdmin ? 'Admin' : 'Not Admin'}
            </Badge>
            <Badge variant={cachedStatus ? "default" : "secondary"}>
              Cache: {cachedStatus === null ? 'None' : (cachedStatus ? 'Admin' : 'Not Admin')}
            </Badge>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm text-amber-900">Admin Status Debug</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleClearCache}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear Cache
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-medium text-amber-900 mb-1">User Info:</p>
          <p className="text-xs text-amber-800">ID: {user.id}</p>
          <p className="text-xs text-amber-800">Email: {user.email}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-amber-900 mb-2">Admin Status:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={contextIsAdmin ? "default" : "secondary"}>
              AuthContext: {authLoading ? 'Loading...' : (contextIsAdmin ? 'Admin' : 'Not Admin')}
            </Badge>
            <Badge variant={hookIsAdmin ? "default" : "secondary"}>
              useAdmin Hook: {hookLoading ? 'Loading...' : (hookIsAdmin ? 'Admin' : 'Not Admin')}
            </Badge>
            <Badge variant={cachedStatus ? "default" : "secondary"}>
              Cached: {cachedStatus === null ? 'No Cache' : (cachedStatus ? 'Admin' : 'Not Admin')}
            </Badge>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-amber-900 mb-1">Loading States:</p>
          <div className="flex gap-2">
            <Badge variant={authLoading ? "destructive" : "default"}>
              Auth: {authLoading ? 'Loading' : 'Ready'}
            </Badge>
            <Badge variant={hookLoading ? "destructive" : "default"}>
              Hook: {hookLoading ? 'Loading' : 'Ready'}
            </Badge>
          </div>
        </div>

        {(contextIsAdmin !== hookIsAdmin) && (
          <div className="p-2 bg-red-100 border border-red-300 rounded">
            <p className="text-xs font-medium text-red-800">
              ⚠️ Status Mismatch: Context and Hook show different admin status
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
