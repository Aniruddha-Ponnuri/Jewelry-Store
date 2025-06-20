'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error occurred:', error)
  }, [error])

  return (
    <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 lg:py-16">
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="text-4xl sm:text-6xl mb-4">⚠️</div>
            <CardTitle className="text-xl sm:text-2xl">Something went wrong!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm sm:text-base text-gray-600">
              We encountered an unexpected error. Please try again or return to the homepage.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={reset}
                className="touch-target"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
              <Button 
                asChild
                variant="outline"
                className="touch-target"
              >
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go home
                </Link>
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left text-xs bg-gray-50 p-3 rounded mt-4">
                <summary className="cursor-pointer font-medium">Error details (dev only)</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">
                  {error.message}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
