import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { scoreCandidateFit } from '@/lib/score_fit'
import { generateReportHTML } from '@/lib/generate_report'

export const maxDuration = 300

/**
 * POST, score the candidate against the JD.
 * Body (all optional):
 *   { job_id: string }   - if the application has no job_id (generic eval), assign this job and score against it
 *
 * Persists overall_fit, recommendation, score_data, and report_html on the application.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  let body: any = {}
  try { body = await request.json() } catch { /* empty body is fine */ }
  const requestedJobId: string | null = typeof body.job_id === 'string' ? body.job_id : null

  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select(`
      id, status, cv_text, completed_at, job_id,
      jobs ( id, title, description, org_level, language ),
      candidates ( first_name, surname1, surname2, preferred_language )
    `)
    .eq('id', params.id)
    .single()
  if (error || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  if (app.status !== 'completed' && app.status !== 'reviewed' && app.status !== 'hired' && app.status !== 'rejected') {
    return NextResponse.json({ error: 'Interview is not yet completed' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let job = app.jobs as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidate = app.candidates as any

  // Generic eval -> job-fit conversion: assign the chosen job, then score against it.
  if (!app.job_id) {
    if (!requestedJobId) {
      return NextResponse.json({ error: 'This is a generic evaluation. Pick a job to score against.' }, { status: 400 })
    }
    const { data: chosenJob, error: jErr } = await supabaseAdmin
      .from('jobs')
      .select('id, title, description, org_level, language')
      .eq('id', requestedJobId)
      .single()
    if (jErr || !chosenJob) return NextResponse.json({ error: 'Chosen job not found' }, { status: 404 })
    // Promote the application to that job
    await supabaseAdmin.from('applications').update({ job_id: chosenJob.id }).eq('id', app.id)
    job = chosenJob
  }

  const candidateName = [candidate?.first_name, candidate?.surname1, candidate?.surname2].filter(Boolean).join(' ') || 'Candidate'
  const language: 'en' | 'es' = (candidate?.preferred_language ?? job?.language ?? 'en') === 'es' ? 'es' : 'en'

  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('role, content')
    .eq('application_id', app.id)
    .order('created_at', { ascending: true })

  const transcript = (messages ?? []).map((m) => ({
    role: m.role as 'assistant' | 'user',
    content: m.content,
  }))

  if (transcript.length === 0) {
    return NextResponse.json({ error: 'No transcript available to score' }, { status: 400 })
  }

  let result
  try {
    result = await scoreCandidateFit({
      applicationId: app.id,
      jobTitle: job?.title ?? 'the role',
      jobDescription: job?.description ?? '',
      orgLevel: job?.org_level ?? null,
      candidateName,
      cvText: app.cv_text ?? null,
      transcript,
      language,
    })
  } catch (err) {
    console.error('Fit scoring failed:', err)
    return NextResponse.json({ error: 'Failed to generate fit score' }, { status: 500 })
  }

  const reportHtml = generateReportHTML({
    candidateName,
    jobTitle: job?.title ?? '',
    orgLevel: job?.org_level ?? null,
    interviewedAt: app.completed_at,
    result,
    language,
  })

  await supabaseAdmin
    .from('applications')
    .update({
      fit_score: result.overall_fit,
      recommendation: result.recommendation,
      report_html: reportHtml,
      score_data: result,
      status: app.status === 'completed' ? 'reviewed' : app.status,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', app.id)

  logAudit({
    action: 'application.reviewed',
    actorType: 'admin',
    resourceType: 'application',
    resourceId: app.id,
    details: { fit_score: result.overall_fit, recommendation: result.recommendation, assigned_job: requestedJobId ?? undefined },
  })

  return NextResponse.json({ ok: true, result })
}
