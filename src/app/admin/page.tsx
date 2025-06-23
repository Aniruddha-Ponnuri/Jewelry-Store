'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/useAdmin'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Package, FolderOpen, TrendingUp, Eye, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'

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

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAdmin()
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalCategories: 0,
    recentProducts: [],
    inStockProducts: 0,
    outOfStockProducts: 0
  })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  // Prevent hydration issues by only rendering client-side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, authLoading, router])

  // Load dashboard statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!isAdmin || !mounted) return

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

        setStats({
          totalUsers: usersResult.count || 0,
          totalProducts: productsResult.count || 0,
          totalCategories: categoriesResult.count || 0,
          recentProducts: recentProductsResult.data || [],
          inStockProducts: inStock,
          outOfStockProducts: outOfStock
        })
      } catch (error) {
        console.error('Error loading dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [isAdmin, mounted, supabase])

  // Early return for SSR to prevent hydration issues
  if (!mounted) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-600 mx-auto"></div>
          <p className="text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-600 mx-auto"></div>
          <p className="text-lg font-medium text-gray-700">Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-red-600 text-xl">Access Denied</div>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          <Link href="/" className="text-blue-600 hover:underline">Return to Home</Link>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    // Only format on client-side to prevent hydration mismatches
    if (!mounted) return `$${amount.toFixed(2)}`
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }
  
  const formatDate = (dateString: string) => {
    // Only format on client-side to prevent hydration mismatches
    if (!mounted) return new Date(dateString).toLocaleDateString()
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <AdminLayout 
      title="Admin Dashboard" 
      description="Welcome to the SilverPalace Admin Dashboard"
    >
      {/* Welcome Message */}
      <Card className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Welcome back, {user?.email?.split('@')[0]}!
          </CardTitle>
          <CardDescription className="text-amber-700">
            Manage your jewelry store from this central dashboard. Monitor sales, inventory, and user activities.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
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
            <p className="text-xs text-muted-foreground">Available items</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : (
                stats.totalCategories
              )}
            </div>
            <p className="text-xs text-muted-foreground">Product categories</p>
          </CardContent>
        </Card>        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : (
                stats.inStockProducts
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.outOfStockProducts > 0 && (
                <span className="text-red-600">{stats.outOfStockProducts} out of stock</span>
              )}
              {stats.outOfStockProducts === 0 && "All products available"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/products">
              <Button className="w-full justify-start" variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Manage Products
              </Button>
            </Link>
            <Link href="/admin/categories">
              <Button className="w-full justify-start" variant="outline">
                <FolderOpen className="mr-2 h-4 w-4" />
                Manage Categories
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Manage Admins
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Products</CardTitle>
            <CardDescription>Latest additions to your inventory</CardDescription>
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
              <div className="text-center py-6 text-gray-500">
                <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p>No products yet</p>
                <Link href="/admin/products">
                  <Button className="mt-2" size="sm">
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
              <p><strong>Admin Email:</strong> {user?.email}</p>
            </div>
            <div>
              <p><strong>Session:</strong> Active</p>
              <p><strong>Status:</strong> Online</p>
              <p><strong>Version:</strong> 1.0.0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}
