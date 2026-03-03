import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
}

interface AgentRow {
  id: string
  user_id: string
  nom: string
  actions: string[]
  prompt_template: string | null
  statut: string
}

function applyVariables(template: string, context: Record<string, string>): string {
  return Object.entries(context).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    template,
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as { agent_id: string; context_data?: Record<string, string> }
    const { agent_id, context_data = {} } = body

    // Load agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agent_id)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent introuvable' }, { status: 404 })
    }

    const agentRow = agent as AgentRow

    // Build prompt
    const promptTemplate = agentRow.prompt_template || 'Effectuez l\'action demandée pour {client_nom} concernant la facture {facture_numero}.'
    const finalPrompt = applyVariables(promptTemplate, {
      ...context_data,
      date: new Date().toLocaleDateString('fr-FR'),
    })

    // Insert log (running)
    const { data: logData } = await supabase.from('agent_logs').insert({
      agent_id,
      statut: 'running',
      input_data: { prompt: finalPrompt, context: context_data },
    }).select('id').single()
    const logId = (logData as { id: string } | null)?.id

    // Call Claude
    const anthropic = getAnthropicClient()
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'Tu es un assistant comptable expert. Tu réponds de manière concise et professionnelle en français.',
      messages: [{ role: 'user', content: finalPrompt }],
    })

    const responseText = response.content[0]?.type === 'text' ? response.content[0].text : ''

    // Update log (success)
    if (logId) {
      void supabase.from('agent_logs').update({
        statut: 'success',
        output_data: { result: responseText },
      }).eq('id', logId).then(() => {})
    }

    return NextResponse.json({ success: true, output: responseText })

  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
