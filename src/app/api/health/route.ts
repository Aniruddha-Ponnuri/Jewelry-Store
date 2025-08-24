import { NextResponse, type NextRequest } from 'next/server'

// Basic health check endpoint for uptime monitors and load balancers
export async function GET(_request: NextRequest) {
  return NextResponse.json({ status: 'ok', time: new Date().toISOString() })
}

