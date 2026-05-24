// End-to-end candidate-flow tester.
// Walks every gate against the running dev server (http://localhost:3003)
// and reports what the page returns + what state it expects.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const BASE = 'http://localhost:3003'

function log(label, value) { console.log(`[${label}]`, typeof value === 'string' ? value : JSON.stringify(value, null, 2)) }

async function findOrMakeJob() {
  const { data: existing } = await supabase
    .from('jobs').select('id, title, assessments').eq('status', 'open').order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (existing) return existing
  const { data: j, error } = await supabase
    .from('jobs').insert({ title: 'E2E Test Senior PM', description: 'You will lead a cross-functional product team, defining roadmap, prioritising features, and shipping with quality.', org_level: 'Manager', language: 'en', assessments: ['thinking_style', 'growth_orientation', 'career_values'] })
    .select('id, title, assessments').single()
  if (error) throw error
  return j
}

async function makeCandidateAndApplication(jobId) {
  const email = `e2e_${Date.now()}@test.local`
  const { data: cand } = await supabase
    .from('candidates').insert({ first_name: 'E2E', surname1: 'Tester', email, preferred_language: 'en' })
    .select('id').single()
  const { data: app } = await supabase
    .from('applications').insert({ job_id: jobId, candidate_id: cand.id })
    .select('id, token').single()
  return { candidateId: cand.id, applicationId: app.id, token: app.token, email }
}

async function getApply(token) {
  const r = await fetch(`${BASE}/apply/${token}`, { redirect: 'manual' })
  return { status: r.status, headers: Object.fromEntries(r.headers.entries()), html: (await r.text()).slice(0, 4000) }
}

function detectGate(html) {
  if (html.includes('Antes de empezar') || html.includes('Before we begin')) return 'PrivacyGate'
  if (html.includes('Sube tu CV') || html.includes('Upload your CV')) return 'CVUpload'
  if (html.includes('Welcome,') || html.includes('Bienvenido')) return 'Overview'
  if (html.includes('Estilos de Pensamiento') || html.includes('Thinking Style')) return 'Assessment(thinking_style)'
  if (html.includes('Orientación al Desarrollo') || html.includes('Growth Orientation')) return 'Assessment(growth_orientation)'
  if (html.includes('Valores Profesionales') || html.includes('Career Values')) return 'Assessment(career_values)'
  if (html.includes('Encaje Cultural') || html.includes('Culture Fit')) return 'Assessment(culture_fit)'
  if (html.includes('Interview for') || html.includes('Entrevista para') || html.includes('Conversational interview')) return 'InterviewChat'
  return 'UNKNOWN'
}

const job = await findOrMakeJob()
log('job', { id: job.id, title: job.title, assessments: job.assessments })

const { candidateId, applicationId, token, email } = await makeCandidateAndApplication(job.id)
log('candidate', { candidateId, email })
log('application', { applicationId, token })
log('URL', `${BASE}/apply/${token}`)

console.log('\n--- STEP 1: fresh apply ---')
let r = await getApply(token)
log('http', r.status)
log('detected gate', detectGate(r.html))

console.log('\n--- STEP 2: POST consent ---')
let c = await fetch(`${BASE}/api/apply/${token}/consent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
log('http', c.status)
log('body', await c.text())

console.log('\n--- STEP 3: apply after consent ---')
r = await getApply(token)
log('http', r.status)
log('detected gate', detectGate(r.html))

console.log('\n--- STEP 4: POST cv skip ---')
c = await fetch(`${BASE}/api/apply/${token}/cv/skip`, { method: 'POST' })
log('http', c.status)
log('body', await c.text())

console.log('\n--- STEP 5: apply after CV skip ---')
r = await getApply(token)
log('http', r.status)
log('detected gate', detectGate(r.html))

console.log('\n--- STEP 6: POST overview-seen ---')
c = await fetch(`${BASE}/api/apply/${token}/overview-seen`, { method: 'POST' })
log('http', c.status)
log('body', await c.text())

console.log('\n--- STEP 7: apply after overview ---')
r = await getApply(token)
log('http', r.status)
log('detected gate', detectGate(r.html))

console.log('\n--- STEP 8: submit Thinking Style with q1..q12 = "a" ---')
const ts_answers = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`q${i + 1}`, 'a']))
c = await fetch(`${BASE}/api/apply/${token}/assessment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: 'thinking_style', raw_answers: ts_answers }) })
log('http', c.status)
log('body', await c.text())

console.log('\n--- STEP 9: apply after thinking_style ---')
r = await getApply(token)
log('http', r.status)
log('detected gate', detectGate(r.html))

console.log('\n--- STEP 10: submit Growth Orientation with all 18 = 4 ---')
const go_answers = Object.fromEntries(Array.from({ length: 18 }, (_, i) => [`q${i + 1}`, 4]))
c = await fetch(`${BASE}/api/apply/${token}/assessment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: 'growth_orientation', raw_answers: go_answers }) })
log('http', c.status)
log('body', await c.text())

console.log('\n--- STEP 11: apply after growth_orientation ---')
r = await getApply(token)
log('http', r.status)
log('detected gate', detectGate(r.html))

console.log('\n--- STEP 12: submit Career Values with all 24 = 3 ---')
const cv_answers = Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`q${i + 1}`, 3]))
c = await fetch(`${BASE}/api/apply/${token}/assessment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: 'career_values', raw_answers: cv_answers }) })
log('http', c.status)
log('body', await c.text())

console.log('\n--- STEP 13: apply after career_values (should reach InterviewChat) ---')
r = await getApply(token)
log('http', r.status)
log('detected gate', detectGate(r.html))

console.log('\n--- STEP 14: opening chat turn (userMessage: null) ---')
c = await fetch(`${BASE}/api/apply/${token}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userMessage: null }) })
log('http', c.status)
const chatBody = await c.text()
log('body (first 500)', chatBody.slice(0, 500))

console.log('\n--- CLEANUP: delete e2e candidate ---')
await supabase.from('candidates').delete().eq('id', candidateId)
console.log('done')
