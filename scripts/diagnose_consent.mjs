// Quick diagnostic: pull the apply token's application + consent state from the live DB.
// Run from project root: `node scripts/diagnose_consent.mjs <token>`
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const envPath = '.env.local'
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Missing env'); process.exit(1) }

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const token = process.argv[2] || '786232c6-47ed-4b85-8662-37d0b23c70eb'

const { data: app, error: aErr } = await supabase
  .from('applications')
  .select('id, status, cv_url, completed_at, job_id, candidate_id, token')
  .eq('token', token)
  .maybeSingle()
console.log('application lookup:')
console.log('  error:', aErr)
console.log('  app:', app)

if (!app) process.exit(0)

const { data: consents, error: cErr } = await supabase
  .from('privacy_consents')
  .select('*')
  .eq('application_id', app.id)
console.log('\nprivacy_consents for this application:')
console.log('  error:', cErr)
console.log('  count:', consents?.length ?? 0)
console.log('  rows:', JSON.stringify(consents, null, 2))

// Try the inserted check the page does:
const { data: check, error: checkErr } = await supabase
  .from('privacy_consents')
  .select('id')
  .eq('application_id', app.id)
  .eq('accepted', true)
  .limit(1)
  .maybeSingle()
console.log('\npage-level hasConsent check:')
console.log('  error:', checkErr)
console.log('  result:', check)
console.log('  would render PrivacyGate?', !check)

// Try inserting fresh to see if the schema works at all
console.log('\nTesting insert directly:')
const { data: insRes, error: insErr } = await supabase
  .from('privacy_consents')
  .insert({
    application_id: app.id,
    consent_type: 'diagnostic_test',
    consent_text: 'test row from diagnose script',
    accepted: true,
    accepted_at: new Date().toISOString(),
  })
  .select()
console.log('  error:', insErr)
console.log('  inserted:', insRes)
