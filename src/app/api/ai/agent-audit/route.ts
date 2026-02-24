import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runAuditAgent } from '@/lib/agents/audit-agent'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const result = await runAuditAgent(user.id)
    return NextResponse.json({ success: true, ...result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne'
    const status = message.includes('Limite') ? 429 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
