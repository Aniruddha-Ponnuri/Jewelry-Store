'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 lg:py-16">
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="text-4xl sm:text-6xl mb-4">🔍</div>
            <CardTitle className="text-xl sm:text-2xl">Page Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm sm:text-base text-gray-600">
              Sorry, we couldn&apos;t find the page you&apos;re looking for. 
              It might have been moved, deleted, or the link might be incorrect.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                asChild
                className="touch-target"
                variant="default"
              >
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go home
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline"
                className="touch-target"
              >
                <Link href="/products">
                  <Search className="mr-2 h-4 w-4" />
                  Browse products
                </Link>
              </Button>
            </div>            <div className="pt-4 border-t">
              <Button 
                onClick={() => window.history.back()}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Go back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
