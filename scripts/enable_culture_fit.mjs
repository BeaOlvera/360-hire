// Enable Culture Fit (OCAI) on an existing job + set a default company culture profile + reset the test application.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const TOKEN = process.argv[2] || '786232c6-47ed-4b85-8662-37d0b23c70eb'

// Look up application + job
const { data: app } = await supabase.from('applications').select('id, job_id').eq('token', TOKEN).single()
if (!app || !app.job_id) { console.error('Application or job not found'); process.exit(1) }

const { data: job } = await supabase.from('jobs').select('id, title, assessments, culture_profile').eq('id', app.job_id).single()
console.log('Current job:', { id: job.id, title: job.title, assessments: job.assessments, culture_profile: job.culture_profile })

// Add culture_fit if not already; set a default 4-quadrant profile
const next = new Set([...(job.assessments ?? []), 'culture_fit'])
const sampleCulture = { CLAN: 20, ADHOCRACY: 30, MARKET: 30, HIERARCHY: 20 }
await supabase.from('jobs').update({ assessments: Array.from(next), culture_profile: sampleCulture }).eq('id', job.id)
console.log('Updated job assessments to', Array.from(next), 'and culture_profile to', sampleCulture)

// Reset the test application
await supabase.from('privacy_consents').delete().eq('application_id', app.id)
await supabase.from('messages').delete().eq('application_id', app.id)
await supabase.from('assessment_responses').delete().eq('application_id', app.id)
await supabase.from('applications').update({
  status: 'pending', cv_url: null, cv_text: null, video_url: null,
  fit_score: null, recommendation: null, report_html: null, score_data: null,
  started_at: null, completed_at: null, reviewed_at: null, review_notes: null,
}).eq('id', app.id)

console.log('\nApplication reset. Open:')
console.log(`  http://localhost:3003/apply/${TOKEN}`)
console.log('The candidate flow now includes Culture Fit (OCAI) as the 4th assessment, before the interview.')
