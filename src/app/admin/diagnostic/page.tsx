'use client'

import { useState } from 'react'
import { useRobustAuth } from '@/hooks/useRobustAuth'
import RobustAdminLayout from '@/components/RobustAdminLayout'
import AdminDiagnostic from '@/components/AdminDiagnostic'
import AdminTroubleshooter from '@/components/AdminTroubleshooter'
import AuthDebugPanel from '@/components/AuthDebugPanel'
import QuickAdminTest from '@/components/QuickAdminTest'
import AdminDebug from '@/components/AdminDebug'
import AdminUsersDebug from '@/components/AdminUsersDebug'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Activity, Bug, Wrench, TestTube, Shield, Users } from 'lucide-react'

export default function AdminDiagnosticPage() {
  const auth = useRobustAuth({
    requireAuth: true,
    requireAdmin: true,
    requireMasterAdmin: true, // Only master admins can access diagnostic page
    redirectOnFail: '/',
    refreshInterval: 60000
  })

  const [activeView, setActiveView] = useState('overview')

  const NavButton = ({ id, icon: Icon, children, active }: { 
    id: string, 
    icon: React.ComponentType<{ className?: string }>, 
    children: React.ReactNode, 
    active: boolean 
  }) => (
    <Button
      onClick={() => setActiveView(id)}
      variant={active ? "default" : "outline"}
      className={`flex items-center space-x-2 ${active ? 'bg-blue-600 text-white' : ''}`}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Button>
  )

  return (
    <RobustAdminLayout 
      title="Master Admin Diagnostic Center" 
      description="Comprehensive diagnostic tools for admin authentication, storage, and system health (Master Admin Only)"
      requireMasterAdmin={true}
    >
      {/* Header with System Status */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-2xl text-blue-900 flex items-center gap-3">
                  Master Admin Diagnostic Center
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Master Admin Only
                  </Badge>
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Monitor and troubleshoot admin authentication, storage, and system functionality
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                System Online
              </Badge>
              {auth.isAuthenticated && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin Authenticated
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <NavButton id="overview" icon={Activity} active={activeView === 'overview'}>
              Overview
            </NavButton>
            <NavButton id="admin-debug" icon={Shield} active={activeView === 'admin-debug'}>
              Admin Debug Panel
            </NavButton>
            <NavButton id="users-debug" icon={Users} active={activeView === 'users-debug'}>
              Users Debug
            </NavButton>
            <NavButton id="diagnostic" icon={Bug} active={activeView === 'diagnostic'}>
              Full Diagnostic
            </NavButton>
            <NavButton id="troubleshooter" icon={Wrench} active={activeView === 'troubleshooter'}>
              Troubleshooter
            </NavButton>
            <NavButton id="auth-debug" icon={Shield} active={activeView === 'auth-debug'}>
              Auth Debug
            </NavButton>
            <NavButton id="quick-test" icon={TestTube} active={activeView === 'quick-test'}>
              Quick Test
            </NavButton>
          </div>
        </CardContent>
      </Card>

      {/* Overview View */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <span>Current Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Authentication</span>
                  <Badge variant={auth.isAuthenticated ? "default" : "destructive"}>
                    {auth.isAuthenticated ? "✅ Active" : "❌ Failed"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Admin Status</span>
                  <Badge variant={auth.isAdmin ? "default" : "secondary"}>
                    {auth.isAdmin ? "✅ Admin" : "👤 User"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Master Admin</span>
                  <Badge variant={auth.isMasterAdmin ? "default" : "secondary"}>
                    {auth.isMasterAdmin ? "✅ Master" : "❌ No"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setActiveView('admin-debug')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Debug Panel
                </Button>
                <Button 
                  onClick={() => setActiveView('users-debug')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Users Debug
                </Button>
                <Button 
                  onClick={() => setActiveView('diagnostic')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Run Full Diagnostic
                </Button>
                <Button 
                  onClick={() => setActiveView('troubleshooter')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  System Troubleshooter
                </Button>
                <Button 
                  onClick={() => setActiveView('quick-test')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Quick Admin Test
                </Button>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span>System Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>User ID</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {auth.user?.id?.slice(0, 8) || 'N/A'}...
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span>Email</span>
                  <span className="text-sm text-gray-600 truncate max-w-32">
                    {auth.user?.email || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Last Verification</span>
                  <span className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Troubleshooting Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span>Troubleshooting Guide</span>
              </CardTitle>
              <CardDescription>
                Follow these steps to resolve common admin and upload issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Run System Diagnostic</h4>
                    <p className="text-sm text-gray-600">Start with the full diagnostic to identify specific issues</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Database Setup</h4>
                    <p className="text-sm text-gray-600">Run SQL scripts: fix-admin-database.sql → fix-image-storage.sql → bootstrap-admin.sql</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Storage Verification</h4>
                    <p className="text-sm text-gray-600">Check Supabase Dashboard → Storage → Verify &quot;images&quot; bucket exists and is public</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">4</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Re-run Diagnostic</h4>
                    <p className="text-sm text-gray-600">Verify all fixes are working by running the diagnostic again</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Diagnostic View */}
      {activeView === 'diagnostic' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bug className="h-5 w-5 text-red-600" />
              <span>Comprehensive System Diagnostic</span>
            </CardTitle>
            <CardDescription>
              Deep system analysis for admin creation and image upload functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminDiagnostic />
          </CardContent>
        </Card>
      )}

      {/* Troubleshooter View */}
      {activeView === 'troubleshooter' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              <span>System Troubleshooter</span>
            </CardTitle>
            <CardDescription>
              Automated troubleshooting and system health checks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminTroubleshooter />
          </CardContent>
        </Card>
      )}

      {/* Auth Debug View */}
      {activeView === 'auth-debug' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span>Authentication Debug Panel</span>
            </CardTitle>
            <CardDescription>
              Detailed authentication session and storage analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthDebugPanel />
          </CardContent>
        </Card>
      )}

      {/* Quick Test View */}
      {activeView === 'quick-test' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TestTube className="h-5 w-5 text-green-600" />
              <span>Quick Admin Test</span>
            </CardTitle>
            <CardDescription>
              Fast admin status and functionality verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-2xl">
              <QuickAdminTest />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Debug Panel View */}
      {activeView === 'admin-debug' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Admin Debug Panel</span>
            </CardTitle>
            <CardDescription>
              Essential debug information for admin authentication status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminDebug />
          </CardContent>
        </Card>
      )}

      {/* Users Debug View */}
      {activeView === 'users-debug' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Admin Users Debug</span>
            </CardTitle>
            <CardDescription>
              Debug tools for admin users table and management functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminUsersDebug />
          </CardContent>
        </Card>
      )}
    </RobustAdminLayout>
  )
}
