import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Bookmark, ShoppingBag } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
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
    return <div>Product not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative aspect-square rounded-lg overflow-hidden">
          {product.image_path ? (
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product_images/${product.image_path}`}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full flex items-center justify-center">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-amber-600">₹{product.price}</span>
            <Badge variant={product.is_in_stock ? "default" : "destructive"}>
              {product.is_in_stock ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Category</h3>
              <p className="capitalize">{product.category}</p>
            </div>
            <div>
              <h3 className="font-semibold">Material</h3>
              <p className="capitalize">{product.material}</p>
            </div>
            {product.weight && (
              <div>
                <h3 className="font-semibold">Weight</h3>
                <p>{product.weight}g</p>
              </div>
            )}
            {product.gemstone && (
              <div>
                <h3 className="font-semibold">Gemstone</h3>
                <p>{product.gemstone}</p>
              </div>
            )}
          </div>
          
          <p className="text-gray-700">{product.description}</p>
          
          <div className="flex space-x-4">
            <Button size="lg">
              <Bookmark className="mr-2 h-5 w-5" />
              Bookmark
            </Button>
            <Button size="lg" disabled={!product.is_in_stock}>
              <ShoppingBag className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
