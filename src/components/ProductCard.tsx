'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { toggleBookmark } from '@/lib/supabase/bookmarks'
import { useAuth } from '@/lib/contexts/AuthContext'

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth()
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    const checkBookmark = async () => {
      if (user?.id) {
        const bookmarks = await getBookmarks(user.id)
        setIsBookmarked(bookmarks.includes(product.id))
      }
    }
    checkBookmark()
  }, [user, product.id])

  const handleBookmark = async () => {
    if (!user?.id) return
    const success = await toggleBookmark(user.id, product.id)
    setIsBookmarked(success)
  }

  return (
    <div className="product-card">
      <Image 
        src={product.images[0]} 
        alt={product.name}
        width={400}
        height={300}
      />
      <h3>{product.name}</h3>
      <button onClick={handleBookmark}>
        {isBookmarked ? '❤️' : '🤍'}
      </button>
    </div>
  )
}
