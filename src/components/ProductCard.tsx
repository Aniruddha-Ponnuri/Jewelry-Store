'use client'

import { useState, memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types/database'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { getPublicImageUrl } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  isBookmarked?: boolean
  onBookmarkChange?: () => void
  priority?: boolean
}

function ProductCard({ product, isBookmarked = false, onBookmarkChange, priority = false }: ProductCardProps) {
  const { user } = useAuth()
  const [bookmarked, setBookmarked] = useState(isBookmarked)
  const [loading, setLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const supabase = createClient()

  const toggleBookmark = async () => {
    if (!user) {
      toast.error("Please sign in to bookmark products")
      return
    }

    setLoading(true)

    try {
      if (bookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.product_id)

        if (!error) {
          setBookmarked(false)
          toast.success("Bookmark removed")
          onBookmarkChange?.()
        } else {
          toast.error("Failed to remove bookmark")
        }
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert([{
            user_id: user.id,
            product_id: product.product_id
          }])

        if (!error) {
          setBookmarked(true)
          toast.success("Product bookmarked")
          onBookmarkChange?.()
        } else {
          toast.error("Failed to bookmark product")
        }
      }    } catch {
      toast.error("Something went wrong")
    }

    setLoading(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 w-full max-w-sm mx-auto bg-white border-gray-200">
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.image_path ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-amber-600 rounded-full animate-spin"></div>
              </div>
            )}
            <Image
              src={getPublicImageUrl(product.image_path) || '/placeholder-jewelry.jpg'}
              alt={product.name}
              fill
              className={`object-cover transition-all duration-500 group-hover:scale-105 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
              onLoad={() => setImageLoading(false)}
              quality={85}
            />
          </>
        ) : (
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">💎</div>
              <span className="text-gray-500 text-xs sm:text-sm">No Image</span>
            </div>
          </div>
        )}
        
        {/* Stock status overlay */}
        {!product.is_in_stock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <Badge variant="destructive" className="text-sm font-semibold px-3 py-1">
              Out of Stock
            </Badge>
          </div>
        )}
        
        {/* Bookmark button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/90 hover:bg-white shadow-sm backdrop-blur-sm touch-target focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          onClick={toggleBookmark}
          disabled={loading}
          aria-label={bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
        >
          <Heart 
            className={`h-4 w-4 transition-all duration-200 ${
              bookmarked 
                ? 'text-red-500 fill-current scale-110' 
                : 'text-gray-600 hover:text-red-500'
            } ${loading ? 'animate-pulse' : ''}`} 
          />
        </Button>
      </div>
      
      <CardContent className="p-3 sm:p-4 space-y-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm sm:text-base lg:text-lg leading-tight line-clamp-2 text-gray-900 group-hover:text-amber-700 transition-colors">
            {product.name}
          </h3>
          
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
          
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold text-amber-600">
                {formatPrice(product.price)}
              </span>
              {product.weight && (
                <span className="text-xs text-gray-500">{product.weight}g</span>
              )}
            </div>
            
            <div className="flex flex-col gap-1">
              <Badge variant="secondary" className="text-xs capitalize text-center">
                {product.category}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize text-center">
                {product.material}
              </Badge>
            </div>
          </div>
          
          {product.gemstone && (
            <div className="flex items-center gap-1">
              <span className="text-amber-500">✨</span>
              <p className="text-xs sm:text-sm font-medium text-amber-700 capitalize">
                {product.gemstone}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-3 sm:p-4 pt-0">
        <Button 
          asChild 
          className="w-full touch-target transition-all duration-200 hover:scale-105" 
          disabled={!product.is_in_stock}
          variant={product.is_in_stock ? "default" : "secondary"}
          style={!product.is_in_stock ? { 
            backgroundColor: '#f1f5f9', 
            color: '#64748b', 
            cursor: 'not-allowed',
            pointerEvents: 'auto'
          } : {}}
        >
          {product.is_in_stock ? (
            <Link 
              href={`/products/${product.product_id}`}
              className="flex items-center justify-center gap-2"
              aria-label={`View details for ${product.name}`}
            >
              <span className="text-sm sm:text-base">View Details</span>
            </Link>
          ) : (
            <span 
              className="flex items-center justify-center gap-2 cursor-not-allowed"
              aria-label={`${product.name} is out of stock`}
            >
              <span className="text-sm sm:text-base">Out of Stock</span>
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default memo(ProductCard)
