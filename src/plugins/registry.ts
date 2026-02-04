// Plugin registry for FinPilote

import type {
  IPlugin,
  InstalledPlugin,
  PluginContext,
  PluginResult,
  PluginRegistry as IPluginRegistry,
} from './types'

class PluginRegistryImpl implements IPluginRegistry {
  plugins: Map<string, IPlugin> = new Map()
  private installedPlugins: Map<string, InstalledPlugin> = new Map()
  private pluginFactories: Map<string, () => Promise<IPlugin>> = new Map()

  registerFactory(pluginId: string, factory: () => Promise<IPlugin>) {
    this.pluginFactories.set(pluginId, factory)
  }

  async install(
    pluginId: string,
    config: Record<string, unknown> = {}
  ): Promise<InstalledPlugin> {
    const factory = this.pluginFactories.get(pluginId)
    if (!factory) {
      throw new Error(`Plugin not found in marketplace: ${pluginId}`)
    }

    try {
      const plugin = await factory()
      await plugin.initialize(config)

      this.plugins.set(pluginId, plugin)

      const installed: InstalledPlugin = {
        id: pluginId,
        manifest: plugin.manifest,
        status: 'active',
        installedAt: new Date().toISOString(),
        config,
      }

      this.installedPlugins.set(pluginId, installed)
      return installed
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const installed: InstalledPlugin = {
        id: pluginId,
        manifest: {
          id: pluginId,
          name: pluginId,
          version: '0.0.0',
          description: 'Failed to load',
          author: 'unknown',
          capabilities: [],
        },
        status: 'error',
        installedAt: new Date().toISOString(),
        config,
        lastError: errorMessage,
      }
      this.installedPlugins.set(pluginId, installed)
      throw error
    }
  }

  async uninstall(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      await plugin.destroy()
      this.plugins.delete(pluginId)
    }
    this.installedPlugins.delete(pluginId)
  }

  get(pluginId: string): IPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  list(): InstalledPlugin[] {
    return Array.from(this.installedPlugins.values())
  }

  async execute(
    pluginId: string,
    action: string,
    context: PluginContext
  ): Promise<PluginResult> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      return {
        success: false,
        error: `Plugin not installed: ${pluginId}`,
      }
    }

    const installed = this.installedPlugins.get(pluginId)
    if (installed?.status !== 'active') {
      return {
        success: false,
        error: `Plugin is not active: ${pluginId}`,
      }
    }

    const startTime = Date.now()
    try {
      const result = await plugin.execute(action, {
        ...context,
        config: { ...installed.config, ...context.config },
      })
      return {
        ...result,
        metadata: {
          ...result.metadata,
          executionTime: Date.now() - startTime,
        },
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (installed) {
        installed.lastError = errorMessage
      }
      return {
        success: false,
        error: errorMessage,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      }
    }
  }

  getAvailablePlugins(): string[] {
    return Array.from(this.pluginFactories.keys())
  }
}

// Global singleton registry
export const pluginRegistry = new PluginRegistryImpl()

// Export for testing
export { PluginRegistryImpl }
