// Plugin Execution API

import { NextRequest, NextResponse } from 'next/server'
import { pluginRegistry, registerMarketplacePlugins } from '@/plugins'
import type { PluginContext } from '@/plugins'

// Initialize marketplace plugins on first request
let initialized = false

function ensureInitialized() {
  if (!initialized) {
    registerMarketplacePlugins()
    initialized = true
  }
}

// POST /api/plugins/execute - Execute a plugin action
export async function POST(request: NextRequest) {
  ensureInitialized()

  try {
    const body = await request.json()
    const { pluginId, action, context } = body as {
      pluginId: string
      action: string
      context?: Partial<PluginContext>
    }

    if (!pluginId || !action) {
      return NextResponse.json(
        { error: 'pluginId and action are required' },
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

    const pluginContext: PluginContext = {
      userId: context?.userId,
      financialData: context?.financialData,
      transactions: context?.transactions,
      config: context?.config || {},
    }

    const result = await pluginRegistry.execute(pluginId, action, pluginContext)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to execute plugin'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
