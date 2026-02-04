// Plugin Management API

import { NextRequest, NextResponse } from 'next/server'
import { pluginRegistry, registerMarketplacePlugins, MARKETPLACE_CATALOG } from '@/plugins'

// Initialize marketplace plugins on first request
let initialized = false

function ensureInitialized() {
  if (!initialized) {
    registerMarketplacePlugins()
    initialized = true
  }
}

// GET /api/plugins - List installed plugins
export async function GET() {
  ensureInitialized()

  const installed = pluginRegistry.list()
  const available = MARKETPLACE_CATALOG

  return NextResponse.json({
    installed,
    available,
  })
}

// POST /api/plugins - Install a plugin
export async function POST(request: NextRequest) {
  ensureInitialized()

  try {
    const body = await request.json()
    const { pluginId, config } = body

    if (!pluginId) {
      return NextResponse.json({ error: 'pluginId is required' }, { status: 400 })
    }

    const installed = await pluginRegistry.install(pluginId, config || {})

    return NextResponse.json({
      success: true,
      plugin: installed,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to install plugin'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/plugins - Uninstall a plugin
export async function DELETE(request: NextRequest) {
  ensureInitialized()

  try {
    const { searchParams } = new URL(request.url)
    const pluginId = searchParams.get('pluginId')

    if (!pluginId) {
      return NextResponse.json({ error: 'pluginId is required' }, { status: 400 })
    }

    await pluginRegistry.uninstall(pluginId)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to uninstall plugin'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
