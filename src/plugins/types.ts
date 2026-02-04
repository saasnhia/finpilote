// Plugin system types for FinPilote

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  repository?: string
  capabilities: PluginCapability[]
  config?: PluginConfigSchema
}

export type PluginCapability =
  | 'analysis'
  | 'generation'
  | 'transformation'
  | 'integration'
  | 'visualization'

export interface PluginConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    required?: boolean
    default?: unknown
    description?: string
  }
}

export interface PluginContext {
  userId?: string
  financialData?: unknown
  transactions?: unknown[]
  config: Record<string, unknown>
}

export interface PluginResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    executionTime: number
    tokensUsed?: number
  }
}

export interface IPlugin {
  manifest: PluginManifest
  initialize(config: Record<string, unknown>): Promise<void>
  execute(action: string, context: PluginContext): Promise<PluginResult>
  getActions(): PluginAction[]
  destroy(): Promise<void>
}

export interface PluginAction {
  name: string
  description: string
  parameters?: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object'
      required?: boolean
      description?: string
    }
  }
}

export interface InstalledPlugin {
  id: string
  manifest: PluginManifest
  status: 'active' | 'inactive' | 'error'
  installedAt: string
  config: Record<string, unknown>
  lastError?: string
}

export interface PluginRegistry {
  plugins: Map<string, IPlugin>
  install(pluginId: string, config?: Record<string, unknown>): Promise<InstalledPlugin>
  uninstall(pluginId: string): Promise<void>
  get(pluginId: string): IPlugin | undefined
  list(): InstalledPlugin[]
  execute(pluginId: string, action: string, context: PluginContext): Promise<PluginResult>
}
