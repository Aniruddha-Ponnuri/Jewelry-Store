'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Menu, Heart, LogOut, Shield, Package, FolderOpen, Loader2, Users, Activity } from 'lucide-react'
import ClientNavigation from './ClientNavigation'
import AdminDropdown from './AdminDropdown'

export default function Navigation() {
  const { user, isAdmin, isMasterAdmin, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileLoggingOut, setIsMobileLoggingOut] = useState(false)

  const handleMobileSignOut = async () => {
    setIsMobileLoggingOut(true)
    try {
      await signOut()
      // signOut does window.location.href, so this won't execute
    } catch {
      window.location.href = '/'
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm" role="banner">
      <div className="container mx-auto px-4 max-w-full">
        <div className="flex h-16 items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2 relative z-10">
              <div className="h-8 w-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">💎</span>
              </div>
              <span className="font-bold text-lg sm:text-xl truncate">SilverPalace</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 relative z-10" role="navigation" aria-label="Main navigation">
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
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="flex items-center space-x-4 relative z-20">
            <AdminDropdown />
            <ClientNavigation />

            {/* Mobile Menu Toggle */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[280px] sm:w-[320px] max-w-[90vw] flex flex-col h-full bg-white">
                <div className="flex flex-col h-full">
                  <SheetHeader className="px-4 py-4 border-b border-gray-100 flex-shrink-0">
                    <SheetTitle className="text-left">Menu</SheetTitle>
                    {user && isAdmin && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 w-fit">
                        {isMasterAdmin ? 'Master Admin' : 'Admin'}
                      </Badge>
                    )}
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="flex flex-col gap-6">
                      {/* Main Navigation */}
                      <div className="space-y-1">
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Navigation</h3>
                        <Link
                          href="/"
                          className="block py-2 px-3 text-sm font-medium rounded-lg hover:bg-amber-50 hover:text-amber-600 transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          Home
                        </Link>
                        <Link
                          href="/products"
                          className="block py-2 px-3 text-sm font-medium rounded-lg hover:bg-amber-50 hover:text-amber-600 transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          Products
                        </Link>
                        {user && (
                          <Link
                            href="/bookmarks"
                            className="flex items-center gap-2 py-2 px-3 text-sm font-medium rounded-lg hover:bg-amber-50 hover:text-amber-600 transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            <Heart className="h-4 w-4" />
                            Bookmarks
                          </Link>
                        )}
                      </div>

                      {/* Admin Section */}
                      {isAdmin && (
                        <div className="space-y-1 pt-4 border-t border-amber-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Shield className="h-4 w-4 text-amber-600" />
                            <h3 className="text-xs font-medium text-amber-700 uppercase tracking-wide">
                              {isMasterAdmin ? 'Master Admin' : 'Admin Panel'}
                            </h3>
                          </div>

                          <Link
                            href="/admin"
                            className="flex items-center gap-3 py-2 px-3 text-sm font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            <Shield className="h-4 w-4" />
                            Dashboard
                          </Link>
                          <Link
                            href="/admin/products"
                            className="flex items-center gap-3 py-2 px-3 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            <Package className="h-4 w-4 text-purple-600" />
                            Products
                          </Link>
                          <Link
                            href="/admin/categories"
                            className="flex items-center gap-3 py-2 px-3 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            <FolderOpen className="h-4 w-4 text-green-600" />
                            Categories
                          </Link>

                          {isMasterAdmin && (
                            <>
                              <Link
                                href="/admin/users"
                                className="flex items-center gap-3 py-2 px-3 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                onClick={() => setIsOpen(false)}
                              >
                                <Users className="h-4 w-4 text-blue-600" />
                                User Management
                              </Link>
                              <Link
                                href="/admin/diagnostic"
                                className="flex items-center gap-3 py-2 px-3 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                onClick={() => setIsOpen(false)}
                              >
                                <Activity className="h-4 w-4 text-red-600" />
                                Diagnostics
                              </Link>
                            </>
                          )}
                        </div>
                      )}

                      {/* Account Section */}
                      <div className="space-y-3 pt-4 border-t">
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account</h3>

                        {!user ? (
                          <div className="space-y-2">
                            <Link href="/login" onClick={() => setIsOpen(false)}>
                              <Button variant="outline" className="w-full justify-start">
                                Sign In
                              </Button>
                            </Link>
                            <Link href="/register" onClick={() => setIsOpen(false)}>
                              <Button className="w-full justify-start bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                                Sign Up
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-lg truncate">
                              {user.email}
                            </div>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={handleMobileSignOut}
                              disabled={isMobileLoggingOut}
                            >
                              {isMobileLoggingOut ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Signing Out...
                                </>
                              ) : (
                                <>
                                  <LogOut className="mr-2 h-4 w-4" />
                                  Sign Out
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
