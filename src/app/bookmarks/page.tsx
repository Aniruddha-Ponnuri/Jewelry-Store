'use client'

import { useEffect, useState } from 'react'
import { useRobustAuth } from '@/hooks/useRobustAuth'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types/database'
import ProductCard from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HeartOff } from 'lucide-react'
import Link from 'next/link'

export default function BookmarksPage() {
  const { user } = useRobustAuth({
    requireAuth: true,
    requireAdmin: false
  })
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) return
      
      setLoading(true)
        // Fetch bookmarks with product details
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          user_id,
          product_id,
          created_at,
          products:product_id (product_id, name, description, price, image_path, is_in_stock, category, material, weight, gemstone, created_at, updated_at)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        
      if (error) {
        console.error('Error fetching bookmarks:', error)      } else {
        // Extract products from bookmarks  
        const bookmarkProducts = data?.map(b => b.products as unknown as Product).filter(Boolean) || []
        setProducts(bookmarkProducts)
      }
      
      setLoading(false)
    }

    fetchBookmarks()
  }, [user, supabase])

  const removeBookmark = async (productId: string) => {
    if (!user) return
    
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId)

    if (error) {
      console.error('Error removing bookmark:', error)    } else {
      // Update state to remove the bookmark
      setProducts(prev => prev.filter(p => p.product_id !== productId))
    }
  }
  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="text-sm sm:text-base text-gray-600">Loading your bookmarks...</p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Your Bookmarked Jewelry</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {products.length > 0 
            ? "Your favorite pieces all in one place" 
            : "You haven't bookmarked any pieces yet"}
        </p>
      </div>

      {products.length === 0 ? (
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-lg sm:text-xl">No Bookmarks Yet</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 sm:gap-6 text-center p-4 sm:p-6">
            <HeartOff className="h-12 w-12 sm:h-16 sm:w-16 text-amber-600" />            
            <p className="text-base sm:text-lg text-gray-600">
              You haven&apos;t saved any jewelry pieces to your bookmarks yet.
            </p>
            <Button asChild className="touch-target">
              <Link href="/products">
                Browse Our Collection
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {products.map((product) => (
            <div key={product.product_id} className="relative group">
              <ProductCard 
                product={product} 
                isBookmarked={true}
                onBookmarkChange={() => removeBookmark(product.product_id)}
                priority={false}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 bg-white/90 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 touch-target backdrop-blur-sm"
                onClick={() => removeBookmark(product.product_id)}
                aria-label={`Remove ${product.name} from bookmarks`}
              >
                <HeartOff className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
