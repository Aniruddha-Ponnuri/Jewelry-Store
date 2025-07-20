'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function QuickAdminTest() {
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    setTestResult('')
    
    try {
      const supabase = createClient()
      
      // Test 1: Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      let result = 'Test Results:\n\n'
      
      if (sessionError) {
        result += `❌ Session Error: ${sessionError.message}\n`
      } else if (!session) {
        result += '❌ No active session\n'
      } else {
        result += `✅ Session found: ${session.user.email}\n`
        result += `   User ID: ${session.user.id}\n`
        result += `   Expires: ${new Date(session.expires_at! * 1000).toLocaleString()}\n\n`
        
        // Test 2: Check admin status
        const { data: adminResult, error: adminError } = await supabase.rpc('is_admin')
        if (adminError) {
          result += `❌ Admin check error: ${adminError.message}\n`
        } else {
          result += `Admin status: ${adminResult ? '✅ TRUE' : '❌ FALSE'}\n`
        }
        
        // Test 3: Check master admin status
        const { data: masterResult, error: masterError } = await supabase.rpc('is_master_admin')
        if (masterError) {
          result += `❌ Master admin check error: ${masterError.message}\n`
        } else {
          result += `Master admin status: ${masterResult ? '✅ TRUE' : '❌ FALSE'}\n\n`
        }
        
        // Test 4: Check admin record
        const { data: adminRecord, error: recordError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          
        if (recordError) {
          result += `❌ Admin record error: ${recordError.message}\n`
        } else if (!adminRecord) {
          result += '❌ No admin record found\n'
        } else {
          result += '✅ Admin record found:\n'
          result += `   Role: ${adminRecord.role}\n`
          result += `   Active: ${adminRecord.is_active}\n`
          result += `   Email: ${adminRecord.email}\n`
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
    <div className="fixed top-4 right-4 z-50 bg-white border-2 border-red-500 p-4 rounded shadow-lg max-w-md">
      <h3 className="font-bold text-red-600 mb-2">🔍 Quick Admin Test</h3>
      <Button 
        onClick={runTest} 
        disabled={loading}
        className="mb-2"
        size="sm"
      >
        {loading ? 'Testing...' : 'Test Admin Status'}
      </Button>
      {testResult && (
        <pre className="text-xs bg-gray-100 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">
          {testResult}
        </pre>
      )}
    </div>
  )
}
