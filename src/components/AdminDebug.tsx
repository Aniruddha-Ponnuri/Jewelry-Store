'use client'

import { useRobustAuth } from '@/hooks/useRobustAuth'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminDebug() {
  const auth = useRobustAuth({
    requireAuth: false,
    requireAdmin: false,
    refreshInterval: 60000
  })
  
  const { user } = useAuth()
  const [manualCheck, setManualCheck] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

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

  return (
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-800">🔍 Admin Debug Panel</CardTitle>
        <CardDescription className="text-blue-700">
          Debug information for admin authentication status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Auth Context */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Auth Context:</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify({
                user: user ? {
                  id: user.id,
                  email: user.email
                } : null
              }, null, 2)}
            </pre>
          </div>

          {/* Robust Auth Hook */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Robust Auth Hook:</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify({
                isAuthenticated: auth.isAuthenticated,
                isAdmin: auth.isAdmin,
                isMasterAdmin: auth.isMasterAdmin,
                loading: auth.loading,
                error: auth.error,
                sessionValid: auth.sessionValid,
                lastVerification: new Date(auth.lastVerification).toISOString(),
                isFullyAuthorized: auth.isFullyAuthorized,
                canAccessAdminRoutes: auth.canAccessAdminRoutes,
                canManageAdmins: auth.canManageAdmins
              }, null, 2)}
            </pre>
          </div>

          {/* Manual Check */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-sm">Manual Database Check:</h3>
              <Button 
                size="sm" 
                onClick={performManualAdminCheck}
                disabled={loading}
              >
                {loading ? 'Checking...' : 'Test Admin Status'}
              </Button>
            </div>
            {manualCheck && (
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-60">
                {JSON.stringify(manualCheck, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
