import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types/database'
import ProductCard from '@/components/ProductCard'

export default async function ProductsPage() {
  const supabase = await createClient()
  
  // Fetch all products
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Products</h1>
        <p className="text-red-600">Error loading products: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Our Jewelry Collection</h1>
        <p className="text-gray-600">Discover our exquisite range of handcrafted silver jewelry</p>
      </div>

      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product: Product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No products available at the moment.</p>
          <p className="text-gray-500 mt-2">Please check back later for our latest collection.</p>
        </div>
      )}
    </div>
  )
}
