// Plugin Marketplace - Available plugins registry

import { pluginRegistry } from '../registry'
import { createAnthropicSkillsPlugin } from './anthropics-skills'

// Register all marketplace plugins
export function registerMarketplacePlugins() {
  // anthropics/skills - AI-powered financial analysis
  pluginRegistry.registerFactory('anthropics/skills', createAnthropicSkillsPlugin)
}

// Marketplace catalog for UI display
export const MARKETPLACE_CATALOG = [
  {
    id: 'anthropics/skills',
    name: 'Anthropic Skills',
    description: 'AI-powered financial analysis and insights using Claude',
    author: 'Anthropic',
    version: '1.0.0',
    capabilities: ['analysis', 'generation', 'transformation'],
    tags: ['ai', 'analysis', 'reports', 'forecasting'],
    downloads: 10000,
    rating: 4.9,
  },
] as const

export type MarketplacePluginId = (typeof MARKETPLACE_CATALOG)[number]['id']
