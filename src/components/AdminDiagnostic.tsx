'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import QuickAdminTest from './QuickAdminTest'

interface DiagnosticResults {
  session?: Record<string, unknown>
  adminFunction?: Record<string, unknown>
  masterAdminFunction?: Record<string, unknown>
  adminUsersTable?: Record<string, unknown>
  storage?: Record<string, unknown>
  imageUpload?: Record<string, unknown>
}

export default function AdminDiagnostic() {
  const [results, setResults] = useState<DiagnosticResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  


  const runDiagnostic = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const diagnosticResults: DiagnosticResults = {}

      // 1. Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      diagnosticResults.session = {
        hasSession: !!session,
        error: sessionError?.message,
        userId: session?.user?.id,
        email: session?.user?.email
      }

      // 2. Test admin functions
      try {
        const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin')
        diagnosticResults.adminFunction = {
          result: isAdminResult,
          error: adminError?.message
        }
      } catch (error) {
        diagnosticResults.adminFunction = {
          error: `Function call failed: ${error}`
        }
      }

      // 3. Test master admin function
      try {
        const { data: isMasterResult, error: masterError } = await supabase.rpc('is_master_admin')
        diagnosticResults.masterAdminFunction = {
          result: isMasterResult,
          error: masterError?.message
        }
      } catch (error) {
        diagnosticResults.masterAdminFunction = {
          error: `Function call failed: ${error}`
        }
      }

      // 4. Check admin_users table access
      try {
        const { data: adminUsers, error: tableError } = await supabase
          .from('admin_users')
          .select('*')
          .limit(5)
        
        diagnosticResults.adminUsersTable = {
          accessible: !tableError,
          error: tableError?.message,
          count: adminUsers?.length || 0,
          users: adminUsers?.map(u => ({ email: u.email, role: u.role, active: u.is_active })) || []
        }
      } catch (error) {
        diagnosticResults.adminUsersTable = {
          error: `Table access failed: ${error}`
        }
      }

      // 5. Enhanced storage buckets check
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
        const imagesBucket = buckets?.find(b => b.name === 'images')
        
        // Additional check: try to access the images bucket directly
        let directBucketAccess = false
        let directAccessError = null
        try {
          const { error: filesError } = await supabase.storage
            .from('images')
            .list('', { limit: 1 })
          directBucketAccess = !filesError
          directAccessError = filesError?.message
        } catch (error) {
          directAccessError = `Direct access failed: ${error}`
        }
        
        diagnosticResults.storage = {
          listBucketsWorks: !bucketsError,
          listBucketsError: bucketsError?.message,
          imagesBucketExists: !!imagesBucket,
          imagesBucketDetails: imagesBucket || null,
          directBucketAccess,
          directAccessError,
          totalBuckets: buckets?.length || 0,
          allBuckets: buckets?.map(b => ({ name: b.name, public: b.public, id: b.id })) || []
        }
      } catch (error) {
        diagnosticResults.storage = {
          error: `Storage access failed: ${error}`
        }
      }

      // 6. Enhanced image upload test
      try {
        // Test with a proper image file instead of text
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        const testImageBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png', 1)
        })
        const testFile = new File([testImageBlob], `test-${Date.now()}.png`, { type: 'image/png' })
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(`test/${testFile.name}`, testFile)
        
        // Clean up test file if upload succeeded
        if (uploadData && !uploadError) {
          await supabase.storage
            .from('images')
            .remove([`test/${testFile.name}`])
        }
        
        diagnosticResults.imageUpload = {
          canUpload: !uploadError,
          error: uploadError?.message,
          uploadData: uploadData ? { path: uploadData.path, id: uploadData.id } : null
        }
      } catch (error) {
        diagnosticResults.imageUpload = {
          error: `Upload test failed: ${error}`
        }
      }

      setResults(diagnosticResults)
    } catch (error) {
      setError(`Diagnostic failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const fixAdminFunctions = async () => {
    setError('Please run the SQL scripts in Supabase SQL Editor:\n1. fix-admin-database.sql\n2. fix-image-storage.sql\n3. bootstrap-admin.sql (with your email)')
  }


  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Fast Admin Status & Functionality Verification */}
      <QuickAdminTest />

      {/* Main Diagnostic Tool Card */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Admin & Upload Diagnostic Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

        {/* Full Diagnostic Section */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Full System Diagnostic</h3>
          <div className="flex gap-2">
            <Button onClick={runDiagnostic} disabled={loading}>
              {loading ? 'Running...' : 'Run Full Diagnostic'}
            </Button>
            <Button variant="outline" onClick={fixAdminFunctions}>
              Show Fix Instructions
            </Button>
          </div>
        </div>

        {error && (
          <Alert>
            <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
          </Alert>
        )}

        {results && (
          <div className="space-y-4">
            <h3 className="font-semibold">Diagnostic Results:</h3>
            
            {/* Session Status */}
            <Card className={results.session?.hasSession ? 'border-green-200' : 'border-red-200'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {results.session?.hasSession ? '✅' : '❌'} Session Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(results.session, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Admin Functions */}
            <Card className={results.adminFunction?.error ? 'border-red-200' : 'border-green-200'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {results.adminFunction?.error ? '❌' : '✅'} Admin Functions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  Admin: {JSON.stringify(results.adminFunction, null, 2)}
                </pre>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto mt-2">
                  Master: {JSON.stringify(results.masterAdminFunction, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Admin Users Table */}
            <Card className={results.adminUsersTable?.accessible ? 'border-green-200' : 'border-red-200'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {results.adminUsersTable?.accessible ? '✅' : '❌'} Admin Users Table
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(results.adminUsersTable, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Storage */}
            <Card className={results.storage?.imagesBucketExists ? 'border-green-200' : 'border-red-200'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {results.storage?.imagesBucketExists ? '✅' : '❌'} Storage & Images Bucket
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(results.storage, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card className={results.imageUpload?.canUpload ? 'border-green-200' : 'border-red-200'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {results.imageUpload?.canUpload ? '✅' : '❌'} Image Upload Test
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(results.imageUpload, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  )
}
