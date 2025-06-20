'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Menu, Heart, LogOut, Shield, Package, FolderOpen } from 'lucide-react'

export default function Navigation() {
  const { user, signOut } = useAuth()
  const { isAdmin } = useAdmin()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const NavItems = () => (
    <>
      <Link href="/" className="text-sm font-medium hover:text-amber-600 transition-colors">
        Home
      </Link>
      <Link href="/products" className="text-sm font-medium hover:text-amber-600 transition-colors">
        Products
      </Link>
      {user && (
        <Link href="/bookmarks" className="text-sm font-medium hover:text-amber-600 transition-colors">
          Bookmarks
        </Link>
      )}      {isAdmin && (
        <Link 
          href="/admin/users" 
          className="admin-desktop-button flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          🛡️ Admin Dashboard
        </Link>
      )}
    </>
  )

  // Prevent hydration mismatch by showing loading state initially
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
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              <div className="md:hidden">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </header>
    )
  }

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
          </div>          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
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
                </DropdownMenuTrigger>                <DropdownMenuContent className="w-64 dropdown-menu-content" align="end" forceMount>
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
                  </div>                  <div className="py-1">
                    <DropdownMenuItem asChild>
                      <Link href="/bookmarks" className="dropdown-item-custom">
                        <Heart className="mr-3 h-4 w-4 text-gray-400" />
                        <span>Bookmarks</span>
                      </Link>
                    </DropdownMenuItem>                    {isAdmin && (
                      <>
                        <div className="dropdown-separator-custom"></div>                        {/* Enhanced Admin Section Header */}
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
                    )}
                    <div className="dropdown-separator-custom"></div>
                    <DropdownMenuItem onClick={signOut} className="dropdown-item-custom text-red-600 hover:bg-red-50">
                      <LogOut className="mr-3 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>            ) : (
              <div className="hidden lg:flex items-center space-x-2">
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
                <Button variant="ghost" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>              <SheetContent side="right" className="w-[300px] sm:w-[350px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-left">Navigation Menu</SheetTitle>
                  {user && isAdmin && (
                    <div className="text-left">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Admin Mode
                      </Badge>
                    </div>
                  )}
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-6">
                  {/* Main Navigation */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Main</h3>
                    <Link 
                      href="/" 
                      className="block text-base font-medium hover:text-amber-600 transition-colors py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      Home
                    </Link>
                    <Link 
                      href="/products" 
                      className="block text-base font-medium hover:text-amber-600 transition-colors py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      Products
                    </Link>
                    {user && (
                      <Link 
                        href="/bookmarks" 
                        className="flex items-center gap-2 text-base font-medium hover:text-amber-600 transition-colors py-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <Heart className="h-4 w-4" />
                        Bookmarks
                      </Link>
                    )}
                  </div>                  {/* Enhanced Admin Section */}
                  {isAdmin && (
                    <div className="space-y-4 pt-4 border-t-2 border-amber-200">
                      {/* Admin Header */}
                      <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-3 rounded-lg border border-amber-200">
                        <h3 className="text-base font-bold text-amber-700 uppercase tracking-wide flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          🛡️ Admin Panel
                        </h3>
                        <p className="text-xs text-amber-600 mt-1">Administrative Controls</p>
                      </div>
                        {/* Primary Admin Dashboard Button */}
                      <Link 
                        href="/admin/users" 
                        className="admin-mobile-primary"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="flex items-center gap-3">
                          <Shield className="h-6 w-6" />
                          🛡️ Admin Dashboard
                        </div>
                      </Link>
                      
                      {/* Admin Management Options */}
                      <div className="space-y-2 pl-2">
                        <Link 
                          href="/admin/products" 
                          className="admin-mobile-secondary flex items-center gap-3"
                          onClick={() => setIsOpen(false)}
                        >
                          <Package className="h-5 w-5 text-amber-600" />
                          📦 Manage Products
                        </Link>
                        <Link 
                          href="/admin/categories" 
                          className="admin-mobile-secondary flex items-center gap-3"
                          onClick={() => setIsOpen(false)}
                        >
                          <FolderOpen className="h-5 w-5 text-amber-600" />
                          📂 Manage Categories
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Auth Section */}
                  {!user && (
                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Account</h3>
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full justify-start">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsOpen(false)}>
                        <Button className="w-full justify-start">
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* User Actions */}
                  {user && (
                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Account</h3>
                      <div className="text-sm text-gray-600 break-all">{user.email}</div>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-red-600 hover:text-red-700"
                        onClick={() => {
                          signOut()
                          setIsOpen(false)
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
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
