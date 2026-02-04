// Plugin Actions API

import { NextRequest, NextResponse } from 'next/server'
import { pluginRegistry, registerMarketplacePlugins } from '@/plugins'

// Initialize marketplace plugins on first request
let initialized = false

function ensureInitialized() {
  if (!initialized) {
    registerMarketplacePlugins()
    initialized = true
  }
}

// GET /api/plugins/actions?pluginId=xxx - Get available actions for a plugin
export async function GET(request: NextRequest) {
  ensureInitialized()

  const { searchParams } = new URL(request.url)
  const pluginId = searchParams.get('pluginId')

  if (!pluginId) {
    return NextResponse.json(
      { error: 'pluginId query parameter is required' },
      { status: 400 }
    )
  }

  const plugin = pluginRegistry.get(pluginId)
  if (!plugin) {
    return NextResponse.json(
      { error: `Plugin not installed: ${pluginId}` },
      { status: 404 }
    )
  }

  const actions = plugin.getActions()

  return NextResponse.json({
    pluginId,
    actions,
  })
}
