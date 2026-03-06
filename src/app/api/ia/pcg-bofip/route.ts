import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimit } from '@/lib/utils/rate-limit'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPTS: Record<string, string> = {
  pcg: `Tu es un expert-comptable français spécialisé dans le Plan Comptable Général (PCG 2025).
Règles STRICTES :
- Réponds UNIQUEMENT selon le PCG officiel français
- Cite toujours le numéro de compte exact (ex: 411, 512, 701)
- Pour chaque compte cité, indique : numéro, intitulé, sens normal (débit/crédit), classe
- Si la question sort du cadre PCG, dis-le clairement
- Ne donne pas de conseil fiscal personnalisé`,

  bofip: `Tu es un expert-comptable français spécialisé dans le BOFIP (Bulletin Officiel des Finances Publiques).
Règles STRICTES :
- Réponds UNIQUEMENT selon les textes du BOFIP disponibles
- Cite TOUJOURS la référence complète (ex: BOI-IS-BASE-20-30, BOI-TVA-CHAMP-10)
- Indique la date de publication/mise à jour si pertinente
- Si tu n'es pas certain d'une référence, dis-le explicitement
- Ne donne pas d'avis personnel — uniquement les textes officiels`,

  cgi: `Tu es un expert-comptable français spécialisé dans le Code Général des Impôts (CGI).
Règles STRICTES :
- Réponds UNIQUEMENT selon les articles du CGI en vigueur
- Cite TOUJOURS l'article exact (ex: Art. 39, Art. 209, Art. 261)
- Mentionne le régime applicable (IS, IR, TVA, etc.)
- Si la loi a évolué récemment, signale-le
- Ne donne pas d'avis personnel — uniquement les textes de loi`,
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    if (!rateLimit(`ai:${user.id}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Trop de requêtes IA, réessayez dans une minute' }, { status: 429 })
    }

    const { question, contexte = 'pcg', dossier_id } = await req.json() as { question: string; contexte?: string; dossier_id?: string }
    if (!question?.trim()) return NextResponse.json({ error: 'Question requise' }, { status: 400 })

    if (question.length > 10_000) {
      return NextResponse.json({ error: 'Question trop longue (max 10 000 caractères)' }, { status: 400 })
    }

    let systemPrompt = SYSTEM_PROMPTS[contexte] ?? SYSTEM_PROMPTS.pcg

    // Inject dossier context if available
    let dossierContext = ''
    if (dossier_id) {
      const { data: dossier } = await supabase
        .from('dossiers')
        .select('nom, forme_juridique, regime_tva, code_naf, chiffre_affaires')
        .eq('id', dossier_id)
        .eq('cabinet_id', user.id)
        .single()

      if (dossier) {
        dossierContext = `\n\nCONTEXTE DU DOSSIER CLIENT :\n` +
          `- Nom : ${dossier.nom ?? 'Non renseigné'}\n` +
          `- Forme juridique : ${dossier.forme_juridique ?? 'Non renseignée'}\n` +
          `- Régime TVA : ${dossier.regime_tva ?? 'Non renseigné'}\n` +
          `- Code NAF : ${dossier.code_naf ?? 'Non renseigné'}\n` +
          `- CA : ${dossier.chiffre_affaires ? dossier.chiffre_affaires + ' €' : 'Non renseigné'}\n` +
          `Adapte tes réponses à ce contexte spécifique.`
        systemPrompt += dossierContext
      }
    }

    // Si la question contient un numéro de compte, cherche dans pcg_sources
    let pcgContext = ''
    const accountMatch = question.match(/\b(\d{3,5})\b/)
    if (accountMatch && contexte === 'pcg') {
      const { data: pcgData } = await supabase
        .from('pcg_sources')
        .select('compte, intitule, description, sens_normal, categorie')
        .ilike('compte', `${accountMatch[1]}%`)
        .limit(5)

      if (pcgData && pcgData.length > 0) {
        pcgContext = '\n\nCOMPTES PCG PERTINENTS TROUVÉS EN BASE :\n' +
          pcgData.map(p =>
            `Compte ${p.compte} — ${p.intitule} (${p.sens_normal}) : ${p.description ?? ''}`
          ).join('\n')
      }
    }

    const userMessage = question + pcgContext

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const responseText = response.content[0]?.type === 'text' ? response.content[0].text : ''

    return NextResponse.json({
      success: true,
      response: responseText,
      contexte,
      sources_trouvees: !!pcgContext,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur IA' }, { status: 500 })
  }
}
