import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { sendCandidateInvite } from '@/lib/email'
import { ASSESSMENT_CODES, type AssessmentCode } from '@/lib/assessments'

/**
 * POST, start an evaluation for this candidate. Two modes:
 *   { job_id: <uuid> }  -> normal job-fit evaluation (find or create application)
 *   { job_id: null }    -> generic evaluation (application with job_id NULL)
 *
 * Optional overrides for this single invitation:
 *   { assessments_override: ['big_five', 'icar_reasoning'] }
 *   { competencies_override: [{name: 'Stakeholder management', weight: 3}] }
 * If omitted or null, the application uses the job's defaults.
 *
 * Returns: { application_id, token }
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  let body: any
  try { body = await request.json() } catch { body = {} }
  const jobId: string | null = typeof body.job_id === 'string' ? body.job_id : null
  const sendEmail: boolean = body.send_email !== false  // default true

  // Validate override fields, all optional
  const assessmentsOverride: string[] | null = Array.isArray(body.assessments_override)
    ? body.assessments_override.filter((c: unknown) => typeof c === 'string' && (ASSESSMENT_CODES as readonly string[]).includes(c as AssessmentCode))
    : null
  const competenciesOverride: Array<{ name: string; weight: 1 | 2 | 3; behaviours?: string[] }> | null = Array.isArray(body.competencies_override)
    ? body.competencies_override
        .filter((c: any) => c && typeof c.name === 'string' && c.name.trim().length > 0)
        .map((c: any) => ({
          name: String(c.name).trim().slice(0, 80),
          weight: ([1, 2, 3] as const).includes(Number(c.weight) as 1 | 2 | 3) ? Number(c.weight) as 1 | 2 | 3 : 2,
          behaviours: Array.isArray(c.behaviours) ? c.behaviours.map((b: any) => String(b).trim()).filter((b: string) => b.length > 0).slice(0, 12) : [],
        })).slice(0, 15)
    : null

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
      .select('id, title, language, status, assessments, competencies')
      .eq('id', jobId)
      .single()
    if (jErr || !j) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    if (j.status !== 'open') return NextResponse.json({ error: 'Job is not open' }, { status: 400 })
    job = j

    // Admin can broaden the questionnaire set per candidate; no subset check.
  }

  const insertPayload: Record<string, any> = job
    ? { job_id: job.id, candidate_id: candidate.id }
    : { job_id: null, candidate_id: candidate.id }
  if (assessmentsOverride) insertPayload.assessments_override = assessmentsOverride
  if (competenciesOverride) insertPayload.competencies_override = competenciesOverride

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
      // Update overrides on existing app if provided
      const updatePayload: Record<string, any> = {}
      if (assessmentsOverride) updatePayload.assessments_override = assessmentsOverride
      if (competenciesOverride) updatePayload.competencies_override = competenciesOverride
      if (Object.keys(updatePayload).length > 0) {
        await supabaseAdmin.from('applications').update(updatePayload).eq('id', existingApp.id)
      }
      applicationId = existingApp.id
      token = existingApp.token
    } else {
      const { data: newApp, error: aErr } = await supabaseAdmin
        .from('applications')
        .insert(insertPayload)
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
      .insert(insertPayload)
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
      const titleForEmail = job?.title ?? ''
      await sendCandidateInvite(candidate.email, fullName, titleForEmail, null, token, appUrl, lang, !job)
    } catch (err) {
      console.error('Invite email failed:', err)
    }
  }

  logAudit({
    action: 'application.invited',
    actorType: 'admin',
    resourceType: 'application',
    resourceId: applicationId,
    details: {
      candidate_id: candidate.id,
      job_id: jobId,
      generic: !jobId,
      send_email: sendEmail,
      assessments_override: assessmentsOverride ?? undefined,
      competencies_override: competenciesOverride ? competenciesOverride.length : undefined,
    },
  })

  return NextResponse.json({ application_id: applicationId, token }, { status: 201 })
}
