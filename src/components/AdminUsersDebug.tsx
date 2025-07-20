'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    <Card className="mb-6 bg-red-50 border-red-200">
      <CardHeader>
        <CardTitle className="text-red-800">🔍 Admin Users Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={testAdminUsersTable} 
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Testing...' : 'Test Admin Users Table'}
        </Button>
        {testResult && (
          <pre className="text-xs bg-gray-100 p-4 rounded max-h-60 overflow-auto whitespace-pre-wrap border">
            {testResult}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}
