'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRobustAuth } from '@/hooks/useRobustAuth'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Menu, Heart, LogOut, Shield, Package, FolderOpen, Loader2 } from 'lucide-react'
import ClientNavigation from './ClientNavigation'
import AdminDropdown from './AdminDropdown'

export default function Navigation() {
  const { user, signOut } = useAuth()
  const auth = useRobustAuth({
    requireAuth: false,
    requireAdmin: false,
    refreshInterval: 60000
  })
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileLoggingOut, setIsMobileLoggingOut] = useState(false)

  // Debug logging
  console.log('🔍 [Navigation] Auth status:', {
    user: user?.email,
    isAuthenticated: auth.isAuthenticated,
    isAdmin: auth.isAdmin,
    isMasterAdmin: auth.isMasterAdmin,
    loading: auth.loading,
    error: auth.error,
    sessionValid: auth.sessionValid
  })
  const handleMobileSignOut = async () => {
    setIsMobileLoggingOut(true)
    try {
      console.log('Starting mobile logout process...')
      await signOut()
      setIsOpen(false)
      console.log('Mobile logout completed successfully')
    } catch (error) {
      console.error('Mobile logout error:', error)
      window.location.href = '/'
    } finally {
      setIsMobileLoggingOut(false)
    }
  }

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
      )}      {auth.isAdmin && (
        <Link 
          href="/admin" 
          className="admin-desktop-button flex items-center gap-2"
        >
          🛡️ Admin Dashboard
        </Link>
      )}
    </>
  )
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 max-w-full overflow-hidden">
        <div className="flex h-16 items-center justify-between min-w-0">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">💎</span>
              </div>
              <span className="font-bold text-lg sm:text-xl truncate">SilverPalace</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <NavItems />
          </nav>

          <div className="flex items-center space-x-4">
            <AdminDropdown />
            <ClientNavigation />

            {/* Mobile Navigation */}
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
                    <SheetTitle className="text-left">Navigation Menu</SheetTitle>
                    {user && auth.isAdmin && (
                      <div className="text-left">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Admin Mode
                        </Badge>
                      </div>
                    )}
                  </SheetHeader>
                  
                  <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
                    <div className="flex flex-col gap-6">
                      {/* Main Navigation */}
                      <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Main</h3>
                    <Link 
                      href="/" 
                      className="block text-base font-medium hover:text-amber-600 transition-colors py-3 px-2 rounded-lg hover:bg-amber-50"
                      onClick={() => setIsOpen(false)}
                    >
                      Home
                    </Link>
                    <Link 
                      href="/products" 
                      className="block text-base font-medium hover:text-amber-600 transition-colors py-3 px-2 rounded-lg hover:bg-amber-50"
                      onClick={() => setIsOpen(false)}
                    >
                      Products
                    </Link>
                    {user && (
                      <Link 
                        href="/bookmarks" 
                        className="flex items-center gap-2 text-base font-medium hover:text-amber-600 transition-colors py-3 px-2 rounded-lg hover:bg-amber-50"
                        onClick={() => setIsOpen(false)}
                      >
                        <Heart className="h-4 w-4" />
                        Bookmarks
                      </Link>
                    )}
                      </div>

                      {/* Enhanced Admin Section */}
                      {auth.isAdmin && (
                    <div className="space-y-4 pt-2 border-t-2 border-amber-200">
                      {/* Admin Header */}
                      <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200 shadow-sm">
                        <h3 className="text-lg font-bold text-amber-700 uppercase tracking-wide flex items-center gap-2">
                          🛡️ Admin Panel
                        </h3>
                        <p className="text-sm text-amber-600 mt-1">Administrative Controls</p>
                          </div>
                          
                          {/* Primary Admin Dashboard Button */}
                          <Link 
                            href="/admin" 
                            className="admin-mobile-primary"
                            onClick={() => setIsOpen(false)}
                          >
                            <div className="flex items-center gap-3">
                              <span>🛡️ Admin Dashboard</span>
                            </div>
                          </Link>
                          
                          {/* Admin Management Options */}
                          <div className="space-y-3">
                        <Link 
                          href="/admin/users" 
                          className="admin-mobile-secondary flex items-center gap-3"
                          onClick={() => setIsOpen(false)}
                        >
                          <Shield className="h-5 w-5 text-amber-600" />
                          <span>👥 Manage Admins</span>
                        </Link>
                        <Link 
                          href="/admin/products" 
                          className="admin-mobile-secondary flex items-center gap-3"
                          onClick={() => setIsOpen(false)}
                        >
                          <Package className="h-5 w-5 text-amber-600" />
                          <span>📦 Manage Products</span>
                        </Link>
                        <Link 
                          href="/admin/categories" 
                          className="admin-mobile-secondary flex items-center gap-3"
                          onClick={() => setIsOpen(false)}
                        >
                          <FolderOpen className="h-5 w-5 text-amber-600" />
                          <span>📂 Manage Categories</span>
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
                          <div className="text-sm text-gray-600 break-words px-2 py-1 bg-gray-50 rounded">{user.email}</div>
                          
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-red-600 hover:text-red-700"
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
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
