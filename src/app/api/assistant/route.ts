import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
}

const SYSTEM_PROMPT = `Tu es un expert-comptable français spécialisé dans le Plan Comptable Général (PCG) et le BOFIP (Bulletin Officiel des Finances Publiques).

Tu réponds UNIQUEMENT sur des sujets comptables, fiscaux et financiers français.
Tu cites toujours le numéro de compte PCG concerné (ex: 401, 601, 7111...) et la référence BOFIP si applicable.
Tu proposes des écritures comptables complètes (débit/crédit) quand c'est pertinent, avec le format :
  Débit [compte] - [libellé] : [montant]
  Crédit [compte] - [libellé] : [montant]

Tu es précis, professionnel et pédagogue. Tu expliques toujours pourquoi tu choisis un compte particulier.
Si une question sort du domaine comptable/fiscal français, tu l'indiques poliment.`

interface MessageRow {
  role: string
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as { conversation_id: string; message: string }
    const { conversation_id, message } = body

    if (!conversation_id || !message?.trim()) {
      return NextResponse.json({ error: 'conversation_id et message requis' }, { status: 400 })
    }

    // Verify conversation belongs to user
    const { data: conv } = await supabase
      .from('conversations_assistant')
      .select('id')
      .eq('id', conversation_id)
      .eq('user_id', user.id)
      .single()
    if (!conv) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

    // Save user message
    await supabase.from('messages_assistant').insert({
      conversation_id,
      role: 'user',
      content: message,
    })

    // Load conversation history (last 20 messages)
    const { data: history } = await supabase
      .from('messages_assistant')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(20)

    const messages: Anthropic.MessageParam[] = (history ?? []).map((m: MessageRow) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    let fullResponse = ''
    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const anthropic = getAnthropicClient()
          const stream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            system: SYSTEM_PROMPT,
            messages,
          })

          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const text = chunk.delta.text
              fullResponse += text
              controller.enqueue(encoder.encode(text))
            }
          }

          // Save assistant message after stream
          await supabase.from('messages_assistant').insert({
            conversation_id,
            role: 'assistant',
            content: fullResponse,
          })

          // Update conversation timestamp + auto-title on first exchange
          const updatePayload: Record<string, string> = { updated_at: new Date().toISOString() }
          await supabase
            .from('conversations_assistant')
            .update(updatePayload)
            .eq('id', conversation_id)

        } catch (err) {
          controller.error(err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      },
    })

  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
