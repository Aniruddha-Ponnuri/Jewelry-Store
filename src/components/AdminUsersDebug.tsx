'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Database, AlertCircle, Loader2 } from 'lucide-react'

export default function AdminUsersDebug() {
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testAdminUsersTable = async () => {
    setLoading(true)
    setTestResult('')
    
    try {
      const supabase = createClient()
      let result = 'Admin Users Table Test:\n\n'
      
      // Test 1: Check if table exists and is accessible
      console.log('Testing admin_users table access...')
      const { data, error, count } = await supabase
        .from('admin_users')
        .select('*', { count: 'exact' })
      
      if (error) {
        result += `❌ Table access error: ${error.message}\n`
        result += `Error details: ${JSON.stringify(error, null, 2)}\n\n`
      } else {
        result += `✅ Table accessible\n`
        result += `   Total records: ${count}\n`
        result += `   Data sample: ${JSON.stringify(data, null, 2)}\n\n`
      }
      
      // Test 2: Check specific query that was failing
      const { data: activeUsers, error: activeError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (activeError) {
        result += `❌ Active users query error: ${activeError.message}\n`
        result += `Error details: ${JSON.stringify(activeError, null, 2)}\n\n`
      } else {
        result += `✅ Active users query successful\n`
        result += `   Active users: ${activeUsers?.length || 0}\n`
        result += `   Data: ${JSON.stringify(activeUsers, null, 2)}\n\n`
      }
      
      // Test 3: Check current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        result += `❌ Session error: ${sessionError.message}\n`
      } else if (!session) {
        result += `❌ No active session\n`
      } else {
        result += `✅ Session found: ${session.user.email}\n`
        
        // Test 4: Check if current user is in admin_users
        const { data: currentUserAdmin, error: currentError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
        
        if (currentError) {
          result += `❌ Current user admin check error: ${currentError.message}\n`
        } else if (!currentUserAdmin) {
          result += `❌ Current user not found in admin_users table\n`
        } else {
          result += `✅ Current user admin record: ${JSON.stringify(currentUserAdmin, null, 2)}\n`
        }
      }
      
      setTestResult(result)
    } catch (error) {
      setTestResult(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full bg-white border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-200 bg-gray-50/50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Admin Users Debug Panel</h3>
              <p className="text-sm text-gray-600 font-normal">Detailed admin user table analysis and testing</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Database className="h-3 w-3 mr-1" />
            Table Access
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Button 
            onClick={testAdminUsersTable} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Test Admin Users Table
              </>
            )}
          </Button>
          
          {testResult && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Test Results
                </h4>
              </div>
              <div className="p-4">
                <pre className="text-xs font-mono bg-gray-50 p-4 rounded-lg border max-h-64 overflow-auto whitespace-pre-wrap leading-relaxed text-gray-800">
                  {testResult}
                </pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
