'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

interface CategoryLinkProps {
  name: string
  emoji: string
  href: string
  dbName?: string
}

export default function CategoryLink({ name, emoji, href, dbName }: CategoryLinkProps) {
  const router = useRouter()
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    
    console.log('🔗 [CATEGORY CLICK] User clicked category:', {
      displayName: name,
      dbName: dbName || name,
      href,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
    })
    
    // Navigate to the products page with category filter
    router.push(href)
  }
  
  return (
    <Link href={href} onClick={handleClick} className="group">
      <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group-focus:ring-2 group-focus:ring-amber-500 group-focus:ring-offset-2">
        <CardContent className="p-4 sm:p-6 text-center">
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
            {emoji}
          </div>
          <h3 className="font-semibold text-base sm:text-lg text-gray-900">
            {name}
          </h3>
        </CardContent>
      </Card>
    </Link>
  )
}
