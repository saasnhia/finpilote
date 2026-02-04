/**
 * Migration Runner Script
 * Executes Phase 1 SQL migration via Supabase client
 *
 * Usage:
 *   npx tsx src/scripts/run-migration.ts
 *
 * Requires:
 *   - NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local (for admin access)
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function runMigration() {
  console.log('🚀 Starting Phase 1 Migration...\n')

  try {
    // Read migration SQL file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '001_phase1_clean.sql')
    console.log('📄 Reading migration file:', migrationPath)
    const sql = readFileSync(migrationPath, 'utf-8')

    // Execute SQL (Supabase client doesn't support raw SQL execution directly)
    // We'll use the REST API endpoint instead
    console.log('\n⚠️  Note: Supabase JS client cannot execute raw SQL directly.')
    console.log('Please run the migration manually in one of these ways:\n')
    console.log('Option 1: Supabase Dashboard → SQL Editor')
    console.log('  1. Open https://supabase.com/dashboard/project/_/sql')
    console.log('  2. Copy the SQL from supabase/migrations/001_phase1_clean.sql')
    console.log('  3. Paste and click "Run"\n')
    console.log('Option 2: Supabase CLI')
    console.log('  supabase db push\n')
    console.log('Option 3: psql (PostgreSQL CLI)')
    console.log('  psql $DATABASE_URL -f supabase/migrations/001_phase1_clean.sql\n')

    // Verify tables exist
    console.log('🔍 Verifying migration status...\n')

    const tables = ['comptes_bancaires', 'categories_personnalisees', 'rapprochements']
    const results = []

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          results.push({ table, exists: false, error: error.message })
        } else {
          results.push({ table, exists: true, count: count || 0 })
        }
      } catch (err: any) {
        results.push({ table, exists: false, error: err.message })
      }
    }

    // Check transactions table columns
    console.log('📊 Migration Status:\n')
    results.forEach(({ table, exists, count, error }) => {
      if (exists) {
        console.log(`✅ ${table}: EXISTS (${count} rows)`)
      } else {
        console.log(`❌ ${table}: NOT FOUND${error ? ` - ${error}` : ''}`)
      }
    })

    // Summary
    const allExist = results.every(r => r.exists)
    console.log('\n' + '='.repeat(50))
    if (allExist) {
      console.log('✅ Migration appears to be complete!')
      console.log('\nNext steps:')
      console.log('  1. Visit http://localhost:3000/parametres/banques')
      console.log('  2. Add a bank account')
      console.log('  3. Visit http://localhost:3000/import-releve')
      console.log('  4. Import a CSV file')
    } else {
      console.log('⚠️  Migration not yet applied.')
      console.log('Please run the SQL manually (see options above)')
    }
    console.log('='.repeat(50) + '\n')
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run migration
runMigration()
