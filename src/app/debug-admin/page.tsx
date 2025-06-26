'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export default function DebugAdminPage() {
  const { user, isAdmin } = useAuth()
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const runDebugChecks = async () => {
      const debug: Record<string, any> = {
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          vercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        }
      }

      try {
        // 1. Check auth user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        debug.auth = {
          user: authUser ? {
            id: authUser.id,
            email: authUser.email,
            confirmed_at: authUser.email_confirmed_at,
            created_at: authUser.created_at
          } : null,
          error: authError?.message || null
        }

        if (authUser) {
          // 2. Check admin_users table directly
          const { data: adminUsers, error: adminUsersError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', authUser.id)

          debug.adminUsersTable = {
            data: adminUsers,
            error: adminUsersError?.message || null
          }

          // 3. Check is_admin function
          const { data: isAdminResult, error: isAdminError } = await supabase.rpc('is_admin')
          debug.isAdminFunction = {
            result: isAdminResult,
            error: isAdminError?.message || null
          }

          // 4. Check all admin users (for debugging)
          const { data: allAdminUsers, error: allAdminError } = await supabase
            .from('admin_users')
            .select('*')
            .limit(10)

          debug.allAdminUsers = {
            data: allAdminUsers,
            error: allAdminError?.message || null
          }

          // 5. Check with explicit UUID
          const { data: explicitCheck, error: explicitError } = await supabase.rpc('is_admin', {
            user_uuid: authUser.id
          })
          debug.explicitIsAdmin = {
            result: explicitCheck,
            error: explicitError?.message || null
          }
        }

        // 6. Test database connection
        const { data: testQuery, error: testError } = await supabase
          .from('admin_users')
          .select('count(*)')
        debug.dbConnection = {
          data: testQuery,
          error: testError?.message || null
        }

      } catch (error) {
        debug.globalError = error instanceof Error ? error.message : String(error)
      }

      setDebugInfo(debug)
      setLoading(false)
    }

    runDebugChecks()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Running debug checks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Debug Information</h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            </div>
            <div>
              <p><strong>Is Admin (Context):</strong> {isAdmin ? 'Yes' : 'No'}</p>
              <p><strong>Environment:</strong> {debugInfo.environment?.nodeEnv || 'Unknown'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(debugInfo.environment, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Auth User Details</h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(debugInfo.auth, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Admin Users Table Query</h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(debugInfo.adminUsersTable, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">is_admin() Function Result</h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(debugInfo.isAdminFunction, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Explicit is_admin() Call</h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(debugInfo.explicitIsAdmin, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">All Admin Users (Sample)</h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(debugInfo.allAdminUsers, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Database Connection Test</h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(debugInfo.dbConnection, null, 2)}
            </pre>
          </div>
        </div>

        {debugInfo.globalError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4">Global Error</h2>
            <div className="bg-red-100 p-4 rounded">
              <pre className="text-sm text-red-800 overflow-auto">
                {String(debugInfo.globalError)}
              </pre>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Instructions</h2>
          <div className="text-blue-700">
            <p className="mb-2">1. <strong>Share this debug output</strong> with your development team</p>
            <p className="mb-2">2. <strong>Check if your user appears in &quot;All Admin Users&quot;</strong></p>
            <p className="mb-2">3. <strong>Verify the is_admin function returns true</strong></p>
            <p className="mb-2">4. <strong>Ensure environment variables are correctly set</strong></p>
            <p>5. <strong>Compare results between local and production</strong></p>
          </div>
        </div>
      </div>
    </div>
  )
}
