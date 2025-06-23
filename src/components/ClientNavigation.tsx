'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Heart, LogOut, Shield, Package, FolderOpen, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function ClientNavigation() {
  const { user, signOut } = useAuth()
  const { isAdmin } = useAdmin()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      console.log('Starting logout process from dropdown...')
      await signOut()
      console.log('Logout completed successfully')
    } catch (error) {
      console.error('Dropdown logout error:', error)
      // Force reload as fallback
      window.location.href = '/'
    }
  }

  if (!user) {
    return (
      <div className="hidden lg:flex items-center space-x-2">
        <Button variant="ghost" asChild>
          <Link href="/login">Sign In</Link>
        </Button>
        <Button asChild>
          <Link href="/register">Sign Up</Link>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
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
            {isAdmin && (
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-amber-600" />
                <span className="text-xs text-amber-600 font-medium">Administrator</span>
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

          {isAdmin && (
            <>
              <div className="dropdown-separator-custom"></div>
              
              {/* Enhanced Admin Section Header */}
              <div className="admin-panel-header">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700">Admin Panel</span>
                </div>
              </div>
              
              {/* Admin Dashboard - Primary Action */}
              <DropdownMenuItem asChild>
                <Link href="/admin/users" className="admin-dropdown-primary">
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
