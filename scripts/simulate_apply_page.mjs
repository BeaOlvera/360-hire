// Simulate exactly what app/apply/[token]/page.tsx does, including the assessment-routing.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const token = process.argv[2] || '786232c6-47ed-4b85-8662-37d0b23c70eb'

const { data: app, error } = await supabase
  .from('applications')
  .select(`
    id, status, cv_url, completed_at,
    jobs ( title, language, assessments ),
    candidates ( first_name, surname1, surname2, preferred_language )
  `)
  .eq('token', token)
  .single()

console.log('application select error:', error)
if (!app) { console.log('NO APPLICATION -> page would 404'); process.exit(0) }
console.log('application status:', app.status)
console.log('completed_at:', app.completed_at)
console.log('cv_url:', app.cv_url)
console.log('jobs:', app.jobs)
console.log('candidates:', app.candidates)

const { data: consent, error: cErr } = await supabase
  .from('privacy_consents')
  .select('id')
  .eq('application_id', app.id)
  .eq('accepted', true)
  .limit(1)
  .maybeSingle()
console.log('\nconsent check error:', cErr)
console.log('consent:', consent)

const { data: doneAssessments, error: aErr } = await supabase
  .from('assessment_responses')
  .select('assessment_code')
  .eq('application_id', app.id)
console.log('\nassessment_responses error:', aErr)
console.log('done assessments:', doneAssessments)

const job = app.jobs
const enabled = Array.isArray(job?.assessments) ? job.assessments : []
const completed = (doneAssessments ?? []).map((d) => d.assessment_code)
const nextAssessment = enabled.find((c) => !completed.includes(c)) ?? null

console.log('\n--- COMPUTED ---')
console.log('hasConsent:', !!consent)
console.log('hasCv:', !!app.cv_url)
console.log('status:', app.status)
console.log('enabled assessments:', enabled)
console.log('completed assessments:', completed)
console.log('nextAssessment:', nextAssessment)

console.log('\n--- PAGE WOULD RENDER ---')
if (app.status === 'completed') console.log('REDIRECT to /complete')
else if (!consent) console.log('PrivacyGate')
else if (!app.cv_url) console.log('CVUpload')
else if (nextAssessment) console.log('Assessment:', nextAssessment)
else console.log('InterviewChat')
