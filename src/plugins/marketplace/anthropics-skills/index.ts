// Anthropics Skills Plugin for FinPilote
// Marketplace ID: anthropics/skills

import Anthropic from '@anthropic-ai/sdk'
import type {
  IPlugin,
  PluginManifest,
  PluginContext,
  PluginResult,
  PluginAction,
} from '../../types'

const MANIFEST: PluginManifest = {
  id: 'anthropics/skills',
  name: 'Anthropic Skills',
  version: '1.0.0',
  description: 'AI-powered financial analysis and insights using Claude',
  author: 'Anthropic',
  repository: 'https://github.com/anthropics/skills',
  capabilities: ['analysis', 'generation', 'transformation'],
  config: {
    apiKey: {
      type: 'string',
      required: false,
      description: 'Anthropic API key (uses ANTHROPIC_API_KEY env var if not provided)',
    },
    model: {
      type: 'string',
      required: false,
      default: 'claude-sonnet-4-20250514',
      description: 'Claude model to use',
    },
    maxTokens: {
      type: 'number',
      required: false,
      default: 4096,
      description: 'Maximum tokens in response',
    },
  },
}

const ACTIONS: PluginAction[] = [
  {
    name: 'analyze-financials',
    description: 'Analyze financial data and provide insights',
    parameters: {
      query: {
        type: 'string',
        required: false,
        description: 'Specific question about the financial data',
      },
      focus: {
        type: 'string',
        required: false,
        description: 'Focus area: profitability, cashflow, trends, risks',
      },
    },
  },
  {
    name: 'generate-report',
    description: 'Generate a financial report summary',
    parameters: {
      reportType: {
        type: 'string',
        required: false,
        description: 'Type of report: monthly, quarterly, annual, custom',
      },
      language: {
        type: 'string',
        required: false,
        description: 'Report language (default: fr)',
      },
    },
  },
  {
    name: 'forecast',
    description: 'Generate financial forecasts and projections',
    parameters: {
      periods: {
        type: 'number',
        required: false,
        description: 'Number of periods to forecast',
      },
      scenario: {
        type: 'string',
        required: false,
        description: 'Scenario: optimistic, realistic, pessimistic',
      },
    },
  },
  {
    name: 'categorize-transaction',
    description: 'Automatically categorize a transaction',
    parameters: {
      description: {
        type: 'string',
        required: true,
        description: 'Transaction description',
      },
      amount: {
        type: 'number',
        required: true,
        description: 'Transaction amount',
      },
    },
  },
  {
    name: 'explain-kpi',
    description: 'Explain a KPI in plain language',
    parameters: {
      kpiName: {
        type: 'string',
        required: true,
        description: 'Name of the KPI to explain',
      },
      value: {
        type: 'number',
        required: false,
        description: 'Current value of the KPI',
      },
    },
  },
]

export class AnthropicSkillsPlugin implements IPlugin {
  manifest = MANIFEST
  private client: Anthropic | null = null
  private config: Record<string, unknown> = {}

  async initialize(config: Record<string, unknown>): Promise<void> {
    this.config = config
    const apiKey = (config.apiKey as string) || process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      throw new Error(
        'Anthropic API key required. Set ANTHROPIC_API_KEY environment variable or provide apiKey in config.'
      )
    }

    this.client = new Anthropic({ apiKey })
  }

  getActions(): PluginAction[] {
    return ACTIONS
  }

  async execute(action: string, context: PluginContext): Promise<PluginResult> {
    if (!this.client) {
      return { success: false, error: 'Plugin not initialized' }
    }

    const model = (this.config.model as string) || 'claude-sonnet-4-20250514'
    const maxTokens = (this.config.maxTokens as number) || 4096

    switch (action) {
      case 'analyze-financials':
        return this.analyzeFinancials(context, model, maxTokens)
      case 'generate-report':
        return this.generateReport(context, model, maxTokens)
      case 'forecast':
        return this.forecast(context, model, maxTokens)
      case 'categorize-transaction':
        return this.categorizeTransaction(context, model, maxTokens)
      case 'explain-kpi':
        return this.explainKpi(context, model, maxTokens)
      default:
        return { success: false, error: `Unknown action: ${action}` }
    }
  }

  private async analyzeFinancials(
    context: PluginContext,
    model: string,
    maxTokens: number
  ): Promise<PluginResult> {
    const query = (context.config.query as string) || 'Provide a general financial analysis'
    const focus = (context.config.focus as string) || 'general'

    const systemPrompt = `You are a financial analyst expert. Analyze the provided financial data and provide actionable insights.
Focus area: ${focus}
Respond in the same language as the data (French if data is in French).
Be concise but thorough. Use specific numbers from the data.`

    const userPrompt = `Financial Data:
${JSON.stringify(context.financialData, null, 2)}

Transactions:
${JSON.stringify(context.transactions?.slice(0, 50), null, 2)}

Question/Request: ${query}`

    return this.callClaude(systemPrompt, userPrompt, model, maxTokens)
  }

  private async generateReport(
    context: PluginContext,
    model: string,
    maxTokens: number
  ): Promise<PluginResult> {
    const reportType = (context.config.reportType as string) || 'monthly'
    const language = (context.config.language as string) || 'fr'

    const systemPrompt = `You are a financial reporting expert. Generate a clear, professional ${reportType} financial report.
Language: ${language === 'fr' ? 'French' : 'English'}
Include: Executive summary, key metrics, trends, and recommendations.
Format with clear sections and bullet points.`

    const userPrompt = `Generate a ${reportType} financial report based on this data:

Financial Data:
${JSON.stringify(context.financialData, null, 2)}

Recent Transactions:
${JSON.stringify(context.transactions?.slice(0, 100), null, 2)}`

    return this.callClaude(systemPrompt, userPrompt, model, maxTokens)
  }

  private async forecast(
    context: PluginContext,
    model: string,
    maxTokens: number
  ): Promise<PluginResult> {
    const periods = (context.config.periods as number) || 3
    const scenario = (context.config.scenario as string) || 'realistic'

    const systemPrompt = `You are a financial forecasting expert. Generate ${scenario} projections for the next ${periods} periods.
Based on historical trends in the data, provide:
1. Revenue projections
2. Cost projections
3. Profit/Loss projections
4. Key assumptions
5. Risk factors
Be specific with numbers and percentages.`

    const userPrompt = `Generate ${periods}-period ${scenario} forecast based on:

Historical Financial Data:
${JSON.stringify(context.financialData, null, 2)}

Transaction History:
${JSON.stringify(context.transactions?.slice(0, 100), null, 2)}`

    return this.callClaude(systemPrompt, userPrompt, model, maxTokens)
  }

  private async categorizeTransaction(
    context: PluginContext,
    model: string,
    maxTokens: number
  ): Promise<PluginResult> {
    const description = context.config.description as string
    const amount = context.config.amount as number

    if (!description || amount === undefined) {
      return { success: false, error: 'description and amount are required' }
    }

    const systemPrompt = `You are a transaction categorization expert.
Categorize the transaction into one of these categories:
- rent (Loyer)
- salaries (Salaires)
- insurance (Assurances)
- subscriptions (Abonnements)
- loan_payments (Emprunts)
- supplies (Fournitures)
- marketing (Marketing)
- utilities (Charges)
- sales (Ventes)
- services (Services)
- other (Autre)

Also determine:
- type: 'income' or 'expense'
- is_fixed: true if it's a fixed/recurring cost, false if variable

Respond ONLY with valid JSON: {"category": "...", "type": "...", "is_fixed": true/false}`

    const userPrompt = `Categorize this transaction:
Description: ${description}
Amount: ${amount}`

    const result = await this.callClaude(systemPrompt, userPrompt, model, 256)

    if (result.success && result.data) {
      try {
        const parsed = JSON.parse(result.data as string)
        return { success: true, data: parsed, metadata: result.metadata }
      } catch {
        return result
      }
    }
    return result
  }

  private async explainKpi(
    context: PluginContext,
    model: string,
    maxTokens: number
  ): Promise<PluginResult> {
    const kpiName = context.config.kpiName as string
    const value = context.config.value as number | undefined

    if (!kpiName) {
      return { success: false, error: 'kpiName is required' }
    }

    const systemPrompt = `You are a financial educator. Explain financial KPIs in simple, clear language.
Target audience: Small business owners who may not have financial expertise.
Be practical and give actionable context.
Respond in French.`

    const userPrompt = `Explain this KPI in simple terms:
KPI: ${kpiName}
${value !== undefined ? `Current Value: ${value}` : ''}

Include:
1. What it means
2. Why it matters
3. ${value !== undefined ? 'What this specific value indicates' : 'How to interpret typical values'}
4. How to improve it`

    return this.callClaude(systemPrompt, userPrompt, model, maxTokens)
  }

  private async callClaude(
    systemPrompt: string,
    userPrompt: string,
    model: string,
    maxTokens: number
  ): Promise<PluginResult> {
    if (!this.client) {
      return { success: false, error: 'Client not initialized' }
    }

    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      })

      const textContent = response.content.find((c) => c.type === 'text')
      const text = textContent && 'text' in textContent ? textContent.text : ''

      return {
        success: true,
        data: text,
        metadata: {
          executionTime: 0,
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        },
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Claude API error'
      return { success: false, error: message }
    }
  }

  async destroy(): Promise<void> {
    this.client = null
    this.config = {}
  }
}

// Factory function for the registry
export function createAnthropicSkillsPlugin(): Promise<IPlugin> {
  return Promise.resolve(new AnthropicSkillsPlugin())
}
