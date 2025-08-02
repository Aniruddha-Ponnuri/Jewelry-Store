'use client'

import { useRobustAuth } from '@/hooks/useRobustAuth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Package, FolderOpen, Users, RefreshCw, AlertTriangle, Activity } from 'lucide-react'
import Link from 'next/link'

interface RobustAdminLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  requireMasterAdmin?: boolean
}

export default function RobustAdminLayout({ 
  children, 
  title,
  description,
  requireMasterAdmin = false 
}: RobustAdminLayoutProps) {
  const auth = useRobustAuth({
    requireAuth: true,
    requireAdmin: true,
    requireMasterAdmin,
    redirectOnFail: '/',
    refreshInterval: 60000 // Refresh every minute
  })

  // Show loading state
  if (auth.loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">
            {requireMasterAdmin ? 'Verifying master admin access...' : 'Verifying admin access...'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Checking authentication and permissions
          </p>
        </div>
      </div>
    )
  }

  // Show error state with detailed info and retry
  if (auth.error || !auth.isFullyAuthorized) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="text-red-600">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm mb-3 text-red-800">
                {auth.error || (requireMasterAdmin ? 'Master admin privileges required' : 'Admin privileges required')}
              </p>
              <div className="text-xs text-red-700 space-y-1 text-left">
                <div>✓ Logged in: {auth.isAuthenticated ? 'Yes' : 'No'}</div>
                <div>✓ Admin: {auth.isAdmin ? 'Yes' : 'No'}</div>
                <div>✓ Master Admin: {auth.isMasterAdmin ? 'Yes' : 'No'}</div>
                <div>✓ Session Valid: {auth.sessionValid ? 'Yes' : 'No'}</div>
                {auth.user && <div>✓ User: {auth.user.email}</div>}
              </div>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={auth.refreshAuth} 
                variant="outline"
                className="flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Verification
              </Button>
              <div className="text-xs text-gray-500">
                <p>If this persists, please contact an administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{title}</h1>
              {description && (
                <p className="text-xs sm:text-sm text-gray-600">{description}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-300 px-3 py-1.5 text-xs font-semibold shadow-sm">
                🛡️ {auth.isMasterAdmin ? 'Master Admin' : 'Admin'}
              </Badge>
              
              {auth.sessionValid && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                  ✓ Verified
                </Badge>
              )}
              
              <Button
                onClick={auth.refreshAuth}
                variant="ghost"
                size="sm"
                className="text-xs px-2 py-1"
                title="Refresh authentication status"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {/* User info bar */}
          <div className="mt-2 text-xs text-gray-500">
            <span>Welcome, {auth.user?.email}</span>
            {auth.lastVerification > 0 && (
              <span className="ml-2">
                Last verified: {new Date(auth.lastVerification).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Link 
              href="/admin" 
              className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 hover:border-amber-300 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
            >
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Dashboard</span>
            </Link>
            
            <Link 
              href="/admin/products" 
              className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 hover:border-amber-300 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
            >
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Products</span>
            </Link>
            
            <Link 
              href="/admin/categories" 
              className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 hover:border-amber-300 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
            >
              <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Categories</span>
            </Link>
            
            {auth.isMasterAdmin && (
              <>
                <Link 
                  href="/admin/users" 
                  className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 hover:border-amber-300 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                >
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Users</span>
                </Link>

                  <Link 
                    href="/admin/diagnostic" 
                    className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                  >
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Diagnostic</span>
                  </Link>
                </>
            )}

            </div>
          </div>
        </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {children}
      </div>
    </div>
  )
}
