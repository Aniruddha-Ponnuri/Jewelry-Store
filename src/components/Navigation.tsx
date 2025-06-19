'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Menu, Heart, LogOut, Settings, Shield } from 'lucide-react'

export default function Navigation() {
  const { user, signOut } = useAuth()
  const { isAdmin, canManageProducts, canManageCategories, canManageAdmins } = useAdmin()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">💎</span>
                </div>
                <span className="font-bold text-xl">Silver Jewelry</span>
              </Link>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-sm font-medium hover:text-amber-600 transition-colors">
                Home
              </Link>
              <Link href="/products" className="text-sm font-medium hover:text-amber-600 transition-colors">
                Products
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>
    )
  }
  const NavItems = () => (
    <>
      <Link href="/" className="text-sm font-medium hover:text-amber-600 transition-colors">
        Home
      </Link>
      <Link href="/products" className="text-sm font-medium hover:text-amber-600 transition-colors">
        Products
      </Link>      {user && (
        <Link href="/bookmarks" className="text-sm font-medium hover:text-amber-600 transition-colors">
          Bookmarks
        </Link>
      )}
      {isAdmin && (
        <Link href="/admin/users" className="text-sm font-medium hover:text-amber-600 transition-colors bg-amber-50 px-2 py-1 rounded">
          🛡️ Admin
        </Link>
      )}
      {canManageProducts && (
        <Link href="/admin/products" className="text-sm font-medium hover:text-amber-600 transition-colors">
          Products
        </Link>
      )}
      {canManageCategories && (
        <Link href="/admin/categories" className="text-sm font-medium hover:text-amber-600 transition-colors">
          Categories
        </Link>
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">💎</span>
              </div>
              <span className="font-bold text-xl">Silver Jewelry</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <NavItems />
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.email}</p>
                      {isAdmin && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          Administrator
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />                  <DropdownMenuItem asChild>
                    <Link href="/bookmarks" className="flex items-center">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Bookmarks</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users" className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {canManageProducts && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/products" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Manage Products</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {canManageCategories && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/categories" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Manage Categories</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {canManageAdmins && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/users" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Manage Admins</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Navigation */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-6">
                  <NavItems />
                  {!user && (
                    <>
                      <Link href="/login">
                        <Button variant="outline" className="w-full justify-start">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button className="w-full justify-start">
                          Sign Up
                        </Button>
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
