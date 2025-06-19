'use client'

import { useState } from 'react'
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
}

export default function ProductCard({ product, isBookmarked = false, onBookmarkChange }: ProductCardProps) {
  const { user } = useAuth()
  const [bookmarked, setBookmarked] = useState(isBookmarked)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const toggleBookmark = async () => {
    if (!user) {
      toast.error("Please sign in to bookmark products")
      return
    }

    setLoading(true)

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
      }
    }

    setLoading(false)
  }

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      <div className="relative aspect-square overflow-hidden">
        {product.image_path ? (
          <Image
            src={getPublicImageUrl(product.image_path) || '/placeholder-jewelry.jpg'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full flex items-center justify-center">
            <span className="text-gray-500">No Image</span>
          </div>
        )}
        {!product.is_in_stock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg">Out of Stock</Badge>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
          onClick={toggleBookmark}
          disabled={loading}
        >
          <Heart className={`h-5 w-5 ${bookmarked ? 'text-red-500 fill-current' : ''}`} />
        </Button>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-amber-600">₹{product.price}</span>
            <div className="flex gap-1">
              <Badge variant="secondary" className="text-xs capitalize">
                {product.category}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {product.material}
              </Badge>
            </div>
          </div>
          {product.gemstone && (
            <p className="text-sm font-medium text-amber-700">✨ {product.gemstone}</p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full" disabled={!product.is_in_stock}>
          <Link href={`/products/${product.product_id}`}>
            {product.is_in_stock ? 'View Details' : 'Out of Stock'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
