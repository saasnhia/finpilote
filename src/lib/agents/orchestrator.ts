/**
 * Worthifast AI Orchestrator — Mistral AI via Vercel AI SDK
 * Handles rate limiting, logging, timeout, and error management.
 */

import { mistral } from '@ai-sdk/mistral'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'

export type AgentType = 'audit' | 'tva' | 'rapprochement' | 'mail'

const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 heure
const TIMEOUT_MS = 30_000

export interface RunAgentOptions {
  agentType: AgentType
  systemPrompt: string
  userPrompt: string
  userId: string
  inputSummary?: string
}

export interface AgentResult {
  text: string
  tokensUsed: number
  durationMs: number
}

export async function runAgent(options: RunAgentOptions): Promise<AgentResult> {
  const { agentType, systemPrompt, userPrompt, userId, inputSummary } = options
  const startTime = Date.now()

  const supabase = await createClient()

  // --- Rate limiting ---
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const { count } = await supabase
    .from('ai_agent_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since)

  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    throw new Error(
      `Limite de ${RATE_LIMIT_MAX} appels par heure atteinte. Réessayez dans quelques minutes.`
    )
  }

  // --- Generate with Mistral ---
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let text = ''
  let tokensUsed = 0

  try {
    const result = await generateText({
      model: mistral('mistral-small-latest'),
      system: systemPrompt,
      prompt: userPrompt,
      abortSignal: controller.signal,
    })
    text = result.text
    tokensUsed = (result.usage?.inputTokens ?? 0) + (result.usage?.outputTokens ?? 0)
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Délai dépassé (30s). Réessayez avec moins de données.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }

  const durationMs = Date.now() - startTime

  // --- Log in Supabase (non-blocking) ---
  void Promise.resolve(
    supabase.from('ai_agent_logs').insert({
      user_id: userId,
      agent_type: agentType,
      input_summary: inputSummary?.slice(0, 200) ?? null,
      output_summary: text.slice(0, 200),
      tokens_used: tokensUsed,
      duration_ms: durationMs,
    })
  ).catch(() => {/* non-critical */})

  return { text, tokensUsed, durationMs }
}

/**
 * Parse a JSON block from an LLM response (handles markdown code fences).
 */
export function parseJsonFromLLM<T>(text: string): T {
  // Try to extract JSON from code fence or raw
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = fenceMatch ? fenceMatch[1] : text
  const objMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (!objMatch) throw new Error('Réponse JSON introuvable dans la réponse IA')
  return JSON.parse(objMatch[0]) as T
}
