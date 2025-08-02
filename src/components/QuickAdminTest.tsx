'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TestTube, CheckCircle, XCircle, Clock, User, Shield, Database } from 'lucide-react'

export default function QuickAdminTest() {
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const runTest = async () => {
    setLoading(true)
    setTestResult('')
    setTestStatus('idle')
    
    try {
      const supabase = createClient()
      
      // Test 1: Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      let result = 'Fast Admin Status & Functionality Verification Results:\n\n'
      let hasErrors = false
      
      if (sessionError) {
        result += `❌ Session Error: ${sessionError.message}\n`
        hasErrors = true
      } else if (!session) {
        result += '❌ No active session\n'
        hasErrors = true
      } else {
        result += `✅ Session found: ${session.user.email}\n`
        result += `   User ID: ${session.user.id}\n`
        result += `   Expires: ${new Date(session.expires_at! * 1000).toLocaleString()}\n\n`
        
        // Test 2: Check admin status
        const { data: adminResult, error: adminError } = await supabase.rpc('is_admin')
        if (adminError) {
          result += `❌ Admin check error: ${adminError.message}\n`
          hasErrors = true
        } else {
          result += `Admin status: ${adminResult ? '✅ TRUE' : '❌ FALSE'}\n`
          if (!adminResult) hasErrors = true
        }
        
        // Test 3: Check master admin status
        const { data: masterResult, error: masterError } = await supabase.rpc('is_master_admin')
        if (masterError) {
          result += `❌ Master admin check error: ${masterError.message}\n`
          hasErrors = true
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
          hasErrors = true
        } else if (!adminRecord) {
          result += '❌ No admin record found\n'
          hasErrors = true
        } else {
          result += '✅ Admin record found:\n'
          result += `   Role: ${adminRecord.role}\n`
          result += `   Active: ${adminRecord.is_active}\n`
          result += `   Email: ${adminRecord.email}\n`
        }
      }
      
      setTestResult(result)
      setTestStatus(hasErrors ? 'error' : 'success')
    } catch (error) {
      const errorMsg = `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      setTestResult(errorMsg)
      setTestStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (loading) return <Clock className="h-4 w-4 animate-spin text-white" />
    if (testStatus === 'success') return <CheckCircle className="h-4 w-4 text-white" />
    if (testStatus === 'error') return <XCircle className="h-4 w-4 text-white" />
    return <TestTube className="h-4 w-4 text-white" />
  }

  const getStatusBadge = () => {
    if (loading) return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="h-3 w-3 mr-1 animate-spin" />
        Testing...
      </Badge>
    )
    if (testStatus === 'success') return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        All Tests Passed
      </Badge>
    )
    if (testStatus === 'error') return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Issues Found
      </Badge>
    )
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        <TestTube className="h-3 w-3 mr-1" />
        Ready to Test
      </Badge>
    )
  }

  return (
    <Card className="w-full bg-white border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-200 bg-gray-50/50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              {getStatusIcon()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Fast Admin Status & Functionality Verification</h3>
              <p className="text-sm text-gray-600 font-normal">Quick diagnostic for admin authentication and permissions</p>
            </div>
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Test Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={runTest} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all duration-200 hover:shadow-md"
              size="lg"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Run Admin Status Test
                </>
              )}
            </Button>
            
            {/* Quick Stats */}
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-1 text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                <User className="w-3 h-3" />
                Session
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                <Shield className="w-3 h-3" />
                Admin
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                <Database className="w-3 h-3" />
                Database
              </div>
            </div>
          </div>

          {/* Results Display */}
          {testResult && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <TestTube className="w-4 h-4" />
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
