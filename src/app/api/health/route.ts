import { NextResponse } from 'next/server'

// Basic health check endpoint for uptime monitors and load balancers
export async function GET() {
  return NextResponse.json({ status: 'ok', time: new Date().toISOString() })
}

