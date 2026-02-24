import { NextResponse } from 'next/server'

/**
 * GET /api/health
 * Endpoint de santé public — utilisé par les monitors externes, n8n, uptime checks.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'FinSoft',
    version: '2.1',
    timestamp: new Date().toISOString(),
  })
}
