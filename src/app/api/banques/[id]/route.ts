import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { BankAccount } from '@/types'

/**
 * PUT /api/banques/[id]
 * Update a bank account
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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
    const { account_name, bank_name, current_balance, is_active } = body

    // Build update object (only include provided fields)
    const updates: any = {}
    if (account_name !== undefined) updates.account_name = account_name
    if (bank_name !== undefined) updates.bank_name = bank_name
    if (current_balance !== undefined) updates.current_balance = current_balance
    if (is_active !== undefined) updates.is_active = is_active

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Aucun champ à mettre à jour' },
        { status: 400 }
      )
    }

    // Update account (RLS ensures user can only update their own accounts)
    const { data: account, error } = await supabase
      .from('comptes_bancaires')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating bank account:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du compte' },
        { status: 500 }
      )
    }

    if (!account) {
      return NextResponse.json(
        { error: 'Compte bancaire non trouvé' },
        { status: 404 }
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

/**
 * DELETE /api/banques/[id]
 * Delete a bank account
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Check if account has associated transactions
    const { count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('bank_account_id', id)

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer: ${count} transaction(s) liée(s) à ce compte`,
          transactions_count: count,
        },
        { status: 409 }
      )
    }

    // Delete account (RLS ensures user can only delete their own accounts)
    const { error } = await supabase
      .from('comptes_bancaires')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting bank account:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du compte' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
