'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface CategoryGridProps {
  className?: string
  fallbackCategories?: Array<{
    name: string
    emoji: string
    href: string
  }>
}

export default function CategoryGrid({ className = '', fallbackCategories = [] }: CategoryGridProps) {
  const [categories, setCategories] = useState<Array<{
    name: string
    emoji: string
    href: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Helper function to get emoji for category
  function getEmojiForCategory(categoryName: string): string {
    const emojiMap: { [key: string]: string } = {
      'rings': '💍',
      'necklaces': '📿',
      'earrings': '👂',
      'bracelets': '💎',
      'pendants': '🔗',
      'chains': '⛓️',
      'watches': '⌚'
    }
    return emojiMap[categoryName.toLowerCase()] || '💎'
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Add timestamp to prevent caching
        const { data: categoriesFromDB } = await supabase
          .from('categories')
          .select('name, description, emoji, is_active, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (categoriesFromDB && categoriesFromDB.length > 0) {
          const mappedCategories = categoriesFromDB.map(cat => ({
            name: cat.description || cat.name,
            emoji: cat.emoji || getEmojiForCategory(cat.name),
            href: `/products?category=${cat.name.toLowerCase()}`
          }))
          setCategories(mappedCategories)
        } else {
          setCategories(fallbackCategories)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategories(fallbackCategories)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()

    // Set up real-time subscription for category changes
    const subscription = supabase
      .channel('categories-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'categories' 
        }, 
        () => {
          console.log('Categories updated, refetching...')
          fetchCategories()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fallbackCategories])

  if (loading) {
    return (
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="bg-gray-200 rounded-full w-12 h-12 mx-auto mb-3 sm:mb-4"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4 mx-auto"></div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}>
      {categories.map((category) => (
        <Link key={category.name} href={category.href} className="group">
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group-focus:ring-2 group-focus:ring-amber-500 group-focus:ring-offset-2">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                {category.emoji}
              </div>
              <h3 className="font-semibold text-base sm:text-lg text-gray-900">
                {category.name}
              </h3>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
