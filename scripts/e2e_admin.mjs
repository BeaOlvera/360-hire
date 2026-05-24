// Admin-side e2e: login, list jobs, list candidates, open a completed app, generate fit score.
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const BASE = 'http://localhost:3003'
const ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'admin123'

function log(label, value) { console.log(`[${label}]`, typeof value === 'string' ? value : JSON.stringify(value, null, 2)) }

// Login
let r = await fetch(`${BASE}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: ADMIN_PASSWORD }) })
log('login http', r.status)
const setCookie = r.headers.get('set-cookie') ?? ''
const sessionCookie = setCookie.split(';')[0]
log('session cookie', sessionCookie)

const auth = { Cookie: sessionCookie }

// Dashboard
r = await fetch(`${BASE}/admin/dashboard`, { headers: auth, redirect: 'manual' })
log('dashboard http', r.status)

// Candidates list
r = await fetch(`${BASE}/admin/candidates`, { headers: auth, redirect: 'manual' })
log('candidates http', r.status)

// Create a candidate via API
const email = `e2e_admin_${Date.now()}@test.local`
r = await fetch(`${BASE}/api/admin/candidates`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify({ first_name: 'AdminE2E', surname1: 'Tester', email, preferred_language: 'en' }) })
log('create candidate http', r.status)
const cand = await r.json()
log('candidate', cand)

// Start generic evaluation
r = await fetch(`${BASE}/api/admin/candidates/${cand.id}/evaluate`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify({ job_id: null, send_email: false }) })
log('generic eval http', r.status)
const gen = await r.json()
log('generic application', gen)

// Open candidate detail
r = await fetch(`${BASE}/admin/candidates/${cand.id}`, { headers: auth, redirect: 'manual' })
log('candidate detail http', r.status)

// Open application review
r = await fetch(`${BASE}/admin/applications/${gen.application_id}`, { headers: auth, redirect: 'manual' })
log('application review http', r.status)

// Try the JD-from-file endpoint without a file (should 400)
const fd = new FormData()
r = await fetch(`${BASE}/api/admin/jobs/extract-from-file`, { method: 'POST', headers: auth, body: fd })
log('jd-extract empty http', r.status)
log('jd-extract body', (await r.text()).slice(0, 200))

console.log('\nadmin loop complete')
