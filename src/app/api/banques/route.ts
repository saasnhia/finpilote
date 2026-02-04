import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { BankAccount } from '@/types'

/**
 * GET /api/banques
 * List all bank accounts for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Fetch bank accounts
    const { data: accounts, error } = await supabase
      .from('comptes_bancaires')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bank accounts:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des comptes bancaires' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, accounts: accounts as BankAccount[] })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/banques
 * Create a new bank account
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Parse request body
    const body = await req.json()
    const { bank_name, account_name, iban, bic, account_type, current_balance } = body

    // Validate required fields
    if (!bank_name || !account_name || !iban) {
      return NextResponse.json(
        { error: 'Champs requis manquants: bank_name, account_name, iban' },
        { status: 400 }
      )
    }

    // Validate IBAN format (basic check)
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/
    if (!ibanRegex.test(iban.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Format IBAN invalide' },
        { status: 400 }
      )
    }

    // Check for duplicate IBAN
    const { data: existing } = await supabase
      .from('comptes_bancaires')
      .select('id')
      .eq('user_id', user.id)
      .eq('iban', iban)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Un compte avec cet IBAN existe déjà' },
        { status: 409 }
      )
    }

    // Insert new account
    const { data: account, error } = await supabase
      .from('comptes_bancaires')
      .insert({
        user_id: user.id,
        bank_name,
        account_name,
        iban: iban.replace(/\s/g, ''), // Remove spaces
        bic: bic || null,
        account_type: account_type || 'checking',
        current_balance: current_balance || 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating bank account:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte bancaire' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, account: account as BankAccount })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
