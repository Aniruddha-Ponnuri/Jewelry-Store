'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Menu, Heart, LogOut, Shield, Package, FolderOpen, Loader2, RefreshCw, Users } from 'lucide-react'
import ClientNavigation from './ClientNavigation'
import AdminDropdown from './AdminDropdown'

export default function Navigation() {
  const { user, isAdmin, isMasterAdmin, signOut, refreshAdminStatus } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileLoggingOut, setIsMobileLoggingOut] = useState(false)

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
      <Link 
        href="/" 
        className="text-sm font-medium hover:text-amber-600 transition-colors relative z-10 cursor-pointer"
        onClick={() => console.log('Navigating to Home')}
      >
        Home
      </Link>
      <Link 
        href="/products" 
        className="text-sm font-medium hover:text-amber-600 transition-colors relative z-10 cursor-pointer"
        onClick={() => console.log('Navigating to Products')}
      >
        Products
      </Link>
      {user && (
        <Link 
          href="/bookmarks" 
          className="text-sm font-medium hover:text-amber-600 transition-colors relative z-10 cursor-pointer"
          onClick={() => console.log('Navigating to Bookmarks')}
        >
          Bookmarks
        </Link>
      )}
    </>
  )
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm" role="banner">
      <div className="container mx-auto px-4 max-w-full">
        <div className="flex h-16 items-center justify-between gap-8">
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
            <NavItems />
          </nav>

          <div className="flex items-center space-x-4 relative z-20">
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
                    {user && isAdmin && (
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
                      {isAdmin && (
                        <div className="space-y-4 pt-2 border-t-2 border-amber-200">
                          {/* Admin Header */}
                          <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-bold text-amber-700 uppercase tracking-wide flex items-center gap-2">
                                🛡️ {isMasterAdmin ? 'Master Admin Panel' : 'Admin Panel'}
                              </h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={refreshAdminStatus}
                                className="h-6 w-6 p-0 hover:bg-amber-200"
                                title="Refresh admin status"
                              >
                                <RefreshCw className="w-3 h-3 text-amber-600" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-amber-600">
                                {isMasterAdmin ? 'Master Administrator' : 'Administrator'}
                              </p>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                                ✓ Verified
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Primary Admin Dashboard Button */}
                          <Link 
                            href="/admin" 
                            className="block p-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors duration-200"
                            onClick={() => setIsOpen(false)}
                          >
                            <div className="flex items-center gap-3">
                              <Shield className="h-5 w-5" />
                              <div className="flex flex-col">
                                <span className="font-medium">Dashboard</span>
                                <span className="text-xs text-amber-100">Overview & analytics</span>
                              </div>
                            </div>
                          </Link>
                          
                          {/* Admin Management Options */}
                          <div className="space-y-3">
                            <Link 
                              href="/admin/products" 
                              className="block p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors duration-200"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="flex items-center gap-3">
                                <Package className="h-5 w-5 text-purple-600" />
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">Products</span>
                                  <span className="text-xs text-gray-500">Manage inventory</span>
                                </div>
                              </div>
                            </Link>
                            
                            <Link 
                              href="/admin/categories" 
                              className="block p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors duration-200"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="flex items-center gap-3">
                                <FolderOpen className="h-5 w-5 text-green-600" />
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">Categories</span>
                                  <span className="text-xs text-gray-500">Organize products</span>
                                </div>
                              </div>
                            </Link>
                            
                            {/* Admin Users Section - Master Admin Only */}
                            {isMasterAdmin && (
                              <Link 
                                href="/admin/users" 
                                className="block p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors duration-200"
                                onClick={() => setIsOpen(false)}
                              >
                                <div className="flex items-center gap-3">
                                  <Users className="h-5 w-5 text-blue-600" />
                                  <div className="flex flex-col flex-1">
                                    <span className="font-medium text-gray-900">User Management</span>
                                    <span className="text-xs text-gray-500">Manage admin access</span>
                                  </div>
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                    Master
                                  </Badge>
                                </div>
                              </Link>
                            )}
                          </div>
                          
                          {/* System Info */}
                          <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-500">
                            <div className="flex justify-between items-center">
                              <span>Session Status</span>
                              <span className="text-green-600">Active</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Auth Section */}
                      {!user && (
                        <div className="space-y-3 pt-4 border-t">
                          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Account</h3>
                          <Link href="/login">
                            <Button 
                              variant="outline" 
                              className="w-full justify-start"
                              onClick={() => setIsOpen(false)}
                            >
                              Sign In
                            </Button>
                          </Link>
                          <Link href="/register">
                            <Button 
                              className="w-full justify-start"
                              onClick={() => setIsOpen(false)}
                            >
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
