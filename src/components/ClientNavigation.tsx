'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRobustAuth } from '@/hooks/useRobustAuth'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Heart, LogOut, Shield, Package, FolderOpen, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function ClientNavigation() {
  const { user, signOut } = useAuth()
  const auth = useRobustAuth({
    requireAuth: false,
    requireAdmin: false,
    refreshInterval: 60000
  })
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Starting logout process from dropdown...')
      }
      await signOut()
      if (process.env.NODE_ENV !== 'production') {
        console.log('Logout completed successfully')
      }
    } catch (error) {
      console.error('Dropdown logout error:', error)
      // Force reload as fallback
      window.location.href = '/'
    }
  }

  if (!user) {
    return (
      <div className="hidden lg:flex items-center space-x-2 relative z-10">
        <Button 
          variant="outline" 
          className="border-gray-300 hover:bg-gray-50 cursor-pointer"
          asChild
        >
          <Link href="/login" className="inline-flex items-center justify-center">
            Sign In
          </Link>
        </Button>
        <Button 
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md cursor-pointer"
          asChild
        >
          <Link href="/register" className="inline-flex items-center justify-center">
            Sign Up
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="Account menu">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 dropdown-menu-content" align="end" forceMount>
        <div className="p-3 border-b border-gray-100">
          <div className="flex flex-col space-y-1">
            <p className="font-medium text-sm text-gray-900 truncate">{user.email}</p>
            {auth.isAdmin && (
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-amber-600" />
                <span className="text-xs text-amber-600 font-medium">
                  {auth.isMasterAdmin ? 'Master Administrator' : 'Administrator'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="py-1">
          <DropdownMenuItem asChild>
            <Link href="/bookmarks" className="dropdown-item-custom">
              <Heart className="mr-3 h-4 w-4 text-gray-400" />
              <span>Bookmarks</span>
            </Link>
          </DropdownMenuItem>

          {auth.isAdmin && (
            <>
              <div className="dropdown-separator-custom"></div>
              
              {/* Enhanced Admin Section Header */}
              <div className="admin-panel-header">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700">
                    {auth.isMasterAdmin ? 'Master Admin Panel' : 'Admin Panel'}
                  </span>
                </div>
              </div>
                {/* Admin Dashboard - Primary Action */}
              <DropdownMenuItem asChild>
                <Link href="/admin" className="admin-dropdown-primary">
                  <Shield className="mr-3 h-5 w-5" />
                  <span className="font-semibold">🛡️ Admin Dashboard</span>
                </Link>
              </DropdownMenuItem>
              
              {/* Admin Actions */}
              <DropdownMenuItem asChild>
                <Link href="/admin/products" className="dropdown-item-custom admin-dropdown-secondary">
                  <Package className="mr-3 h-4 w-4 text-amber-600" />
                  <span className="font-medium">📦 Manage Products</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/categories" className="dropdown-item-custom admin-dropdown-secondary">
                  <FolderOpen className="mr-3 h-4 w-4 text-amber-600" />
                  <span className="font-medium">📂 Manage Categories</span>
                </Link>
              </DropdownMenuItem>
              {auth.isMasterAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin/users" className="dropdown-item-custom admin-dropdown-secondary">
                    <Shield className="mr-3 h-4 w-4 text-amber-600" />
                    <span className="font-medium">👥 Manage Users</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </>
          )}          <div className="dropdown-separator-custom"></div>
          <DropdownMenuItem onClick={handleSignOut} className="dropdown-item-custom text-red-600 hover:bg-red-50" disabled={isLoggingOut}>
            {isLoggingOut ? (
              <Loader2 className="mr-3 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-3 h-4 w-4" />
            )}
            <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
