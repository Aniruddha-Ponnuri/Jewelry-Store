'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Heart, LogOut, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function ClientNavigation() {
  const { user, signOut } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      // signOut does window.location.href, so this won't execute
    } catch {
      window.location.href = '/'
    }
  }

  // Not logged in - show sign in/up buttons (desktop only)
  if (!user) {
    return (
      <div className="hidden lg:flex items-center space-x-2">
        <Button variant="outline" className="border-gray-300 hover:bg-gray-50" asChild>
          <Link href="/login">Sign In</Link>
        </Button>
        <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md" asChild>
          <Link href="/register">Sign Up</Link>
        </Button>
      </div>
    )
  }

  // Logged in - show user dropdown (desktop only, hidden on mobile as mobile menu handles it)
  return (
    <div className="hidden lg:block">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="Account menu">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" align="end">
          {/* User Info */}
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
          </div>

          {/* User Actions */}
          <DropdownMenuItem asChild>
            <Link href="/bookmarks" className="flex items-center gap-2 cursor-pointer">
              <Heart className="h-4 w-4 text-gray-500" />
              Bookmarks
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Sign Out */}
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
          >
            {isLoggingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
