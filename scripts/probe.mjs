import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const email = `probe_${Date.now()}@test.local`
const { data: cand } = await supabase.from('candidates').insert({ first_name: 'Probe', email, preferred_language: 'en' }).select('id').single()
const { data: job } = await supabase.from('jobs').select('id, title, status').eq('status', 'open').limit(1).single()
const { data: app } = await supabase.from('applications').insert({ job_id: job.id, candidate_id: cand.id }).select('id, token').single()
console.log('token:', app.token, '\njob:', job.title, '\n')

const res = await fetch(`http://localhost:3003/apply/${app.token}`)
console.log('HTTP', res.status)
console.log('Content-Type:', res.headers.get('content-type'))
const html = await res.text()
console.log('html length:', html.length)
console.log('\n--- first 3000 chars of HTML ---')
console.log(html.slice(0, 3000))

await supabase.from('candidates').delete().eq('id', cand.id)
