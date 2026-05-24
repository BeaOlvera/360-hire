import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { sendCandidateInvite } from '@/lib/email'

/**
 * POST, start an evaluation for this candidate. Two modes:
 *   { job_id: <uuid> }  -> normal job-fit evaluation (find or create application)
 *   { job_id: null }    -> generic evaluation (application with job_id NULL)
 * Returns: { application_id, token }
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  let body: any
  try { body = await request.json() } catch { body = {} }
  const jobId: string | null = typeof body.job_id === 'string' ? body.job_id : null
  const sendEmail: boolean = body.send_email !== false  // default true

  const { data: candidate, error: cErr } = await supabaseAdmin
    .from('candidates')
    .select('id, first_name, surname1, surname2, email, preferred_language')
    .eq('id', params.id)
    .single()
  if (cErr || !candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

  let job: any = null
  if (jobId) {
    const { data: j, error: jErr } = await supabaseAdmin
      .from('jobs')
      .select('id, title, language, status')
      .eq('id', jobId)
      .single()
    if (jErr || !j) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    if (j.status !== 'open') return NextResponse.json({ error: 'Job is not open' }, { status: 400 })
    job = j
  }

  // Find or create application
  let applicationId: string
  let token: string
  if (job) {
    const { data: existingApp } = await supabaseAdmin
      .from('applications')
      .select('id, token')
      .eq('job_id', job.id)
      .eq('candidate_id', candidate.id)
      .limit(1)
      .maybeSingle()
    if (existingApp) {
      applicationId = existingApp.id
      token = existingApp.token
    } else {
      const { data: newApp, error: aErr } = await supabaseAdmin
        .from('applications')
        .insert({ job_id: job.id, candidate_id: candidate.id })
        .select('id, token')
        .single()
      if (aErr || !newApp) return NextResponse.json({ error: aErr?.message ?? 'Failed to create application' }, { status: 500 })
      applicationId = newApp.id
      token = newApp.token
    }
  } else {
    // Generic eval: never reuse an existing generic-eval application; always create a fresh one.
    const { data: newApp, error: aErr } = await supabaseAdmin
      .from('applications')
      .insert({ job_id: null, candidate_id: candidate.id })
      .select('id, token')
      .single()
    if (aErr || !newApp) return NextResponse.json({ error: aErr?.message ?? 'Failed to create application' }, { status: 500 })
    applicationId = newApp.id
    token = newApp.token
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3003'
  if (sendEmail) {
    try {
      const fullName = [candidate.first_name, candidate.surname1].filter(Boolean).join(' ')
      const lang: 'en' | 'es' = candidate.preferred_language === 'es' ? 'es' : 'en'
      const titleForEmail = job?.title ?? (lang === 'es' ? 'una evaluación general' : 'a general evaluation')
      await sendCandidateInvite(candidate.email, fullName, titleForEmail, null, token, appUrl, lang)
    } catch (err) {
      console.error('Invite email failed:', err)
    }
  }

  logAudit({
    action: 'application.invited',
    actorType: 'admin',
    resourceType: 'application',
    resourceId: applicationId,
    details: { candidate_id: candidate.id, job_id: jobId, generic: !jobId, send_email: sendEmail },
  })

  return NextResponse.json({ application_id: applicationId, token }, { status: 201 })
}
