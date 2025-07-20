'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRobustAuth } from '@/hooks/useRobustAuth'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Package, FolderOpen, TrendingUp, Eye, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import RobustAdminLayout from '@/components/RobustAdminLayout'

interface Product {
  product_id: string
  name: string
  price: number
  category: string
  created_at: string
  is_in_stock: boolean
  image_path?: string
}

interface DashboardStats {
  totalUsers: number
  totalProducts: number
  totalCategories: number
  recentProducts: Product[]
  inStockProducts: number
  outOfStockProducts: number
}

export default function RobustAdminDashboard() {
  const auth = useRobustAuth({
    requireAuth: true,
    requireAdmin: true,
    redirectOnFail: '/',
    refreshInterval: 60000
  })
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalCategories: 0,
    recentProducts: [],
    inStockProducts: 0,
    outOfStockProducts: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  // Load dashboard statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!auth.isFullyAuthorized || auth.loading) {
        return
      }

      try {
        setLoading(true)

        // Use Promise.all to fetch all data in parallel for better performance
        const [usersResult, productsResult, categoriesResult, recentProductsResult, stockResult] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('categories').select('*', { count: 'exact', head: true }),
          supabase
            .from('products')
            .select('product_id, name, price, category, created_at, is_in_stock, image_path')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('products')
            .select('is_in_stock')
        ])

        // Calculate stock statistics
        const stockData = stockResult.data || []
        const inStock = stockData.filter(p => p.is_in_stock).length
        const outOfStock = stockData.filter(p => !p.is_in_stock).length

        const newStats = {
          totalUsers: usersResult.count || 0,
          totalProducts: productsResult.count || 0,
          totalCategories: categoriesResult.count || 0,
          recentProducts: recentProductsResult.data || [],
          inStockProducts: inStock,
          outOfStockProducts: outOfStock
        }

        setStats(newStats)
      } catch (error) {
        console.error('Error loading dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [auth.isFullyAuthorized, auth.loading, supabase])

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN')
  }

  return (
    <RobustAdminLayout 
      title="Admin Dashboard" 
      description="Welcome to the SilverPalace Admin Dashboard"
    >
      {/* Welcome Message */}
      <Card className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Welcome back, {auth.user?.email?.split('@')[0]}!
          </CardTitle>
          <CardDescription className="text-amber-700">
            Manage your jewelry store from this central dashboard. Monitor sales, inventory, and user activities.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : (
                stats.totalUsers
              )}
            </div>
            <p className="text-xs text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : (
                stats.totalProducts
              )}
            </div>
            <p className="text-xs text-muted-foreground">Available products</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : (
                stats.totalCategories
              )}
            </div>
            <p className="text-xs text-muted-foreground">Product categories</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Status</CardTitle>
            <ShoppingBag className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold text-green-600">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                ) : (
                  stats.inStockProducts
                )}
              </div>
              <span className="text-xs text-gray-500">/</span>
              <div className="text-lg font-bold text-red-600">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                ) : (
                  stats.outOfStockProducts
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">In stock / Out of stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/products" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Package className="w-4 h-4 mr-2" />
                Manage Products
              </Button>
            </Link>
            <Link href="/admin/categories" className="block">
              <Button className="w-full justify-start" variant="outline">
                <FolderOpen className="w-4 h-4 mr-2" />
                Manage Categories
              </Button>
            </Link>
            {auth.isMasterAdmin && (
              <Link href="/admin/users" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Recent Products */}
        <Card className="md:col-span-2 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Recent Products
            </CardTitle>
            <CardDescription>Latest products added to your store</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : stats.recentProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm mb-3">No products found</p>
                <Link href="/admin/products">
                  <Button size="sm">
                    Add Your First Product
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentProducts.map((product) => (
                  <div key={product.product_id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="capitalize">{product.category}</span>
                        <span>•</span>
                        <span>{formatDate(product.created_at)}</span>
                        <span>•</span>
                        <Badge 
                          variant={product.is_in_stock ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {product.is_in_stock ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-sm text-amber-600">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </div>
                ))}
                <Link href="/admin/products">
                  <Button variant="outline" className="w-full mt-3" size="sm">
                    View All Products
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p><strong>Website:</strong> SilverPalace Jewelry Store</p>
              <p><strong>Admin Email:</strong> {auth.user?.email}</p>
              <p><strong>Admin Level:</strong> {auth.isMasterAdmin ? 'Master Admin' : 'Admin'}</p>
            </div>
            <div>
              <p><strong>Session:</strong> Active</p>
              <p><strong>Status:</strong> Online</p>
              <p><strong>Version:</strong> 2.0.0 (Robust Auth)</p>
              <p><strong>Last Verification:</strong> {auth.lastVerification > 0 ? new Date(auth.lastVerification).toLocaleTimeString() : 'Never'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </RobustAdminLayout>
  )
}
