// Full comprehensive end-to-end test:
//   - Creates a fresh job with ALL 7 complementary assessments enabled,
//     competencies, and a company culture profile.
//   - Creates a candidate, an application for that job.
//   - Walks every gate: consent → CV → overview → 7 assessments → interview open.
//   - Generates a fit score (admin side).
//   - Generates the Comprehensive report (admin side).
//   - Reports every step's result.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const BASE = 'http://localhost:3003'
const ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'admin123'

function ok(label, ok, extra = '') { console.log(`${ok ? '✓' : '✗'} ${label}${extra ? '  ' + extra : ''}`) }

// 1. Admin login (we'll use a session cookie for admin-only endpoints later)
let r = await fetch(`${BASE}/api/admin/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: ADMIN_PASSWORD }),
})
ok('admin login', r.ok, `(${r.status})`)
const adminCookie = (r.headers.get('set-cookie') ?? '').split(';')[0]

// 2. Create a fresh job with ALL 7 assessments + competencies + culture profile
const culture = { CLAN: 20, ADHOCRACY: 30, MARKET: 30, HIERARCHY: 20 }
const competencies = [
  { name: 'Stakeholder management', weight: 3 },
  { name: 'Strategic thinking',     weight: 3 },
  { name: 'Team leadership',        weight: 2 },
  { name: 'Data-driven judgement',  weight: 2 },
  { name: 'Resilience under change',weight: 1 },
]
r = await fetch(`${BASE}/api/admin/jobs`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
  body: JSON.stringify({
    title: 'Full E2E Senior PM',
    description: 'You will lead a cross-functional product team, define quarterly roadmap, prioritise features, partner with engineering and sales, and ship with quality. You will own outcomes across discovery, scope, delivery and impact. The role reports to the head of product and partners closely with engineering and sales leadership.',
    org_level: 'Manager',
    language: 'en',
    assessments: ['thinking_style', 'growth_orientation', 'career_values', 'culture_fit', 'big_five', 'icar_reasoning', 'resilience'],
    culture_profile: culture,
    competencies,
  }),
})
const jobData = await r.json()
ok('create job (all 7 assessments + competencies + culture)', r.status === 201, `job_id=${jobData.id}`)
const jobId = jobData.id

// 3. Create a candidate + application directly in the DB
const email = `e2e_full_${Date.now()}@test.local`
const { data: cand } = await supabase.from('candidates').insert({ first_name: 'FullE2E', surname1: 'Tester', email, preferred_language: 'en' }).select('id').single()
const { data: app } = await supabase.from('applications').insert({ job_id: jobId, candidate_id: cand.id }).select('id, token').single()
ok('create candidate + application', true, `token=${app.token}`)
const token = app.token
const applicationId = app.id

// 4. Walk every gate
async function getApply() {
  const res = await fetch(`${BASE}/apply/${token}`, { redirect: 'manual' })
  return { status: res.status, html: await res.text() }
}
function detect(html) {
  if (html.includes('Antes de empezar') || html.includes('Before we begin')) return 'PrivacyGate'
  if (html.includes('Sube tu CV') || html.includes('Upload your CV')) return 'CVUpload'
  if (html.includes('Welcome,') || html.includes('Bienvenido')) return 'Overview'
  if (html.includes('Thinking Style') || html.includes('Estilos de Pensamiento')) return 'thinking_style'
  if (html.includes('Orientación al Desarrollo') || html.includes('Growth Orientation')) return 'growth_orientation'
  if (html.includes('Career Values') || html.includes('Valores Profesionales')) return 'career_values'
  if (html.includes('Encaje Cultural') || html.includes('Culture Fit')) return 'culture_fit'
  if (html.includes('Big Five')) return 'big_five'
  if (html.includes('ICAR') || html.includes('Reasoning')) return 'icar_reasoning'
  if (html.includes('Resilience') || html.includes('Resiliencia')) return 'resilience'
  if (html.includes('Interview for') || html.includes('Conversational interview') || html.includes('Entrevista para')) return 'InterviewChat'
  return 'UNKNOWN'
}

let step = await getApply()
ok('1. fresh apply -> PrivacyGate', step.status === 200 && detect(step.html) === 'PrivacyGate', detect(step.html))

await fetch(`${BASE}/api/apply/${token}/consent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
step = await getApply()
ok('2. after consent -> CVUpload', detect(step.html) === 'CVUpload')

await fetch(`${BASE}/api/apply/${token}/cv/skip`, { method: 'POST' })
step = await getApply()
ok('3. after CV skip -> Overview', detect(step.html) === 'Overview')

await fetch(`${BASE}/api/apply/${token}/overview-seen`, { method: 'POST' })
step = await getApply()
ok('4. after overview -> first assessment', step.status === 200, detect(step.html))

// Walk through all 7 assessments (the order is registry order)
const assessmentOrder = ['thinking_style', 'growth_orientation', 'career_values', 'culture_fit', 'big_five', 'icar_reasoning', 'resilience']
for (const code of assessmentOrder) {
  let raw = {}
  if (code === 'thinking_style') {
    raw = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`q${i + 1}`, 'a']))
  } else if (code === 'growth_orientation') {
    raw = Object.fromEntries(Array.from({ length: 18 }, (_, i) => [`q${i + 1}`, 4]))
  } else if (code === 'career_values') {
    raw = Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`q${i + 1}`, 3]))
  } else if (code === 'culture_fit') {
    for (let d = 1; d <= 6; d++) {
      raw[`d${d}_CLAN`] = 20; raw[`d${d}_ADHOCRACY`] = 30; raw[`d${d}_MARKET`] = 30; raw[`d${d}_HIERARCHY`] = 20
    }
  } else if (code === 'big_five') {
    raw = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`q${i + 1}`, 4]))
  } else if (code === 'icar_reasoning') {
    // Submit a mix to get a partial score; use the documented correct answers from icar_reasoning.ts
    const correct = { q1: 'b', q2: 'c', q3: 'b', q4: 'c', q5: 'd', q6: 'b', q7: 'a', q8: 'c', q9: 'b', q10: 'c', q11: 'b', q12: 'a' }
    raw = correct  // perfect score so we can verify the scoring
  } else if (code === 'resilience') {
    raw = Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`q${i + 1}`, 4]))
  }
  const submitRes = await fetch(`${BASE}/api/apply/${token}/assessment`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, raw_answers: raw }),
  })
  ok(`5.${code}: submit (${submitRes.status})`, submitRes.ok)
  if (!submitRes.ok) console.log('   body:', await submitRes.text())
}

step = await getApply()
ok('6. after all assessments -> InterviewChat', detect(step.html) === 'InterviewChat', detect(step.html))

// 5. Open chat turn (verify interview connects to Claude)
r = await fetch(`${BASE}/api/apply/${token}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userMessage: null }) })
const chatBody = await r.json()
ok('7. interview opens (chat returns AI reply)', r.ok && !!chatBody.reply, `reply len=${(chatBody.reply ?? '').length}`)

// Fast-forward: mark application as completed so we can run scoring + comprehensive report
await supabase.from('applications').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', applicationId)

// 6. Admin scoring
r = await fetch(`${BASE}/api/admin/applications/${applicationId}/score`, { method: 'POST', headers: { Cookie: adminCookie, 'Content-Type': 'application/json' }, body: '{}' })
const scoreBody = await r.json()
ok('8. admin generate fit score', r.ok, r.ok ? `fit=${(scoreBody.result.overall_fit * 100).toFixed(0)}% rec=${scoreBody.result.recommendation}` : JSON.stringify(scoreBody).slice(0, 200))

// 7. Comprehensive report
r = await fetch(`${BASE}/api/admin/applications/${applicationId}/comprehensive`, { method: 'GET', headers: { Cookie: adminCookie } })
const compHtml = await r.text()
ok('9. comprehensive report', r.ok, `html len=${compHtml.length}, has exec summary=${compHtml.includes('Executive summary')}`)

// 8. Per-assessment HTML reports
for (const code of assessmentOrder) {
  r = await fetch(`${BASE}/api/admin/applications/${applicationId}/assessment/${code}`, { headers: { Cookie: adminCookie } })
  ok(`10.${code}: HTML report`, r.ok)
}

// 9. Cleanup
await supabase.from('candidates').delete().eq('id', cand.id)
await supabase.from('jobs').delete().eq('id', jobId)
console.log('\nCleanup done.')
