'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🛠️</span>
          </div>
          <CardTitle>We&rsquo;ll be right back</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-sm">
            Our site is undergoing scheduled maintenance to enhance your experience. Please check back soon.
          </p>
          <div>
            <Button asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
