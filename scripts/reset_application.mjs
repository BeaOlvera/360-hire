// Reset an application back to a fresh state (no consent, no CV, no assessments, no messages).
// Usage: node scripts/reset_application.mjs <token>
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const token = process.argv[2]
if (!token) { console.error('Usage: node scripts/reset_application.mjs <token>'); process.exit(1) }

const { data: app, error } = await supabase.from('applications').select('id').eq('token', token).single()
if (error || !app) { console.error('App not found:', error?.message); process.exit(2) }

const id = app.id
console.log('Resetting application', id)

const deletes = [
  ['privacy_consents',  await supabase.from('privacy_consents').delete().eq('application_id', id)],
  ['messages',          await supabase.from('messages').delete().eq('application_id', id)],
  ['assessment_responses', await supabase.from('assessment_responses').delete().eq('application_id', id)],
]
for (const [t, r] of deletes) console.log(`  deleted ${t}:`, r.error ? r.error.message : 'ok')

const upd = await supabase.from('applications').update({
  status: 'pending', cv_url: null, cv_text: null, video_url: null,
  fit_score: null, recommendation: null, report_html: null, score_data: null,
  started_at: null, completed_at: null, reviewed_at: null, review_notes: null,
}).eq('id', id)
console.log('  reset application columns:', upd.error ? upd.error.message : 'ok')

console.log('\nDone. Token is fresh:', `http://localhost:3003/apply/${token}`)
