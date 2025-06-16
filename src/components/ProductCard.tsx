'use client'
import { Product } from "@/types/product";
import { useAuth } from "@/lib/contexts/AuthContext";
import Image from "next/image";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { user, addBookmark, removeBookmark, isBookmarked } = useAuth();
  const bookmarked = isBookmarked(product.id || '');

  const handleBookmarkToggle = () => {
    if (!user) return;
    
    if (bookmarked) {
      removeBookmark(product.id || '');
    } else {
      addBookmark(product.id || '');
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.images[0] || '/placeholder.jpg'}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {user && (
          <button
            onClick={handleBookmarkToggle}
            className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            {bookmarked ? (
              <HeartSolid className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">Out of Stock</span>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="font-serif text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {product.materials.slice(0, 2).map((material, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gold-100 text-gold-800 text-xs rounded-full"
            >
              {material}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gold-600">
            ${product.price.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500 capitalize">
            {product.category}
          </span>
        </div>
      </div>
    </div>
  );
}
