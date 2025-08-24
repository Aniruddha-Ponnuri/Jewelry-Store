import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Bookmark, ShoppingBag, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getPublicImageUrl } from '@/lib/utils'
import { Metadata } from 'next'
import { env } from '@/lib/env'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const supabase = await createClient()
  const { id } = await props.params
  const { data: product } = await supabase
    .from('products')
    .select('name, description, image_path')
    .eq('product_id', id)
    .single()

  const title = product?.name ? `${product.name} | SilverPalace` : 'Product | SilverPalace'
  const description = product?.description || 'Discover our exquisite silver jewelry.'
  const images = product?.image_path ? [{ url: `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product_images/${product.image_path}` }] : []

  return {
    title,
    description,
    alternates: { canonical: `${env.NEXT_PUBLIC_SITE_URL}/products/${id}` },
    openGraph: {
      title,
      description,
      url: `${env.NEXT_PUBLIC_SITE_URL}/products/${id}`,
      images,
      type: 'product',
    },
    twitter: {
      card: images.length ? 'summary_large_image' : 'summary',
      title,
      description,
    },
  }
}

export default async function ProductDetail(props: PageProps) {
  const supabase = await createClient()
  const params = await props.params
  const { id } = params

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('product_id', id)
    .single()
  if (!product) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-4xl sm:text-6xl mb-4">💎</div>
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Product not found</h1>          <p className="text-sm sm:text-base text-gray-600 mb-6">
            The product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild className="touch-target">
            <Link href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
      {/* Back Navigation */}
      <div className="mb-4 sm:mb-6">
        <Button variant="ghost" asChild className="p-2 sm:p-3">
          <Link href="/products" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Products</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
          {product.image_path ? (
            <Image
              src={getPublicImageUrl(product.image_path) || '/placeholder-jewelry.jpg'}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
              priority={true}
              placeholder="empty"
            />
          ) : (
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full flex items-center justify-center">
              <span className="text-gray-500 text-sm sm:text-base">No Image Available</span>
            </div>
          )}
        </div>
        
        {/* Product Details */}
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-2 sm:space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">{product.name}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="text-2xl sm:text-3xl font-bold text-amber-600">₹{product.price.toLocaleString('en-IN')}</span>
              <Badge 
                variant={product.is_in_stock ? "default" : "destructive"} 
                className="w-fit text-sm"
              >
                {product.is_in_stock ? "In Stock" : "Out of Stock"}
              </Badge>
            </div>
          </div>
          
          {/* Product Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Category</h3>
              <p className="capitalize text-sm sm:text-base text-gray-600">{product.category}</p>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Material</h3>
              <p className="capitalize text-sm sm:text-base text-gray-600">{product.material}</p>
            </div>
            {product.weight && (
              <div className="space-y-1">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900">Weight</h3>
                <p className="text-sm sm:text-base text-gray-600">{product.weight}g</p>
              </div>
            )}
            {product.gemstone && (
              <div className="space-y-1">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900">Gemstone</h3>
                <p className="text-sm sm:text-base text-gray-600">{product.gemstone}</p>
              </div>
            )}
          </div>
          
          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Description</h3>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{product.description}</p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <Button 
              size="lg" 
              variant="outline" 
              className="flex-1 touch-target"
              disabled={!product.is_in_stock}
            >
              <Bookmark className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Bookmark</span>
            </Button>
            <Button 
              size="lg" 
              className="flex-1 touch-target"
              disabled={!product.is_in_stock}
            >
              <ShoppingBag className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">
                {product.is_in_stock ? 'Add to Cart' : 'Out of Stock'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
