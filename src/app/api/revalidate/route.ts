import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { env } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    // Require a shared secret for protection in production
    if (process.env.NODE_ENV === 'production') {
      const headerSecret = request.headers.get('x-revalidate-secret') || ''
      const querySecret = new URL(request.url).searchParams.get('secret') || ''
      const provided = headerSecret || querySecret
      if (!env.REVALIDATE_SECRET || provided !== env.REVALIDATE_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { path } = await request.json()

    if (!path || typeof path !== 'string' || !path.startsWith('/')) {
      return NextResponse.json({ error: 'Valid path is required' }, { status: 400 })
    }

    // Revalidate the specified path
    revalidatePath(path)

    return NextResponse.json({ revalidated: true, path })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json({ error: 'Failed to revalidate' }, { status: 500 })
  }
}
