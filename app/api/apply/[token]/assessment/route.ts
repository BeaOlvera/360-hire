import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { getAssessment, ASSESSMENT_CODES } from '@/lib/assessments'

/**
 * POST, save a completed assessment for this application.
 * Body: { code: AssessmentCode, raw_answers: {q1: ..., q2: ...} }
 * Server validates the code, runs scoring, persists to assessment_responses.
 */
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select(`id, status, job_id, assessments_override,
      jobs ( assessments, language ),
      candidates ( preferred_language )
    `)
    .eq('token', params.token)
    .single()
  if (error || !app) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  if (app.status === 'completed' || app.status === 'reviewed' || app.status === 'hired' || app.status === 'rejected') {
    return NextResponse.json({ error: 'Application is closed' }, { status: 400 })
  }

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  const { code, raw_answers } = body
  if (!code || !ASSESSMENT_CODES.includes(code)) {
    return NextResponse.json({ error: 'Invalid assessment code' }, { status: 400 })
  }
  if (!raw_answers || typeof raw_answers !== 'object') {
    return NextResponse.json({ error: 'raw_answers required' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = app.jobs as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidate = app.candidates as any
  const isGeneric = !job
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const override = Array.isArray((app as any).assessments_override) ? (app as any).assessments_override : null
  const enabled: string[] = override ?? (isGeneric
    ? ['thinking_style', 'growth_orientation', 'career_values', 'big_five', 'resilience']
    : (Array.isArray(job?.assessments) ? job.assessments : []))
  if (!enabled.includes(code)) {
    return NextResponse.json({ error: 'This assessment is not enabled for this evaluation' }, { status: 400 })
  }

  const assessment = getAssessment(code)
  if (!assessment) return NextResponse.json({ error: 'Unknown assessment' }, { status: 400 })

  let scores
  try { scores = assessment.score(raw_answers) } catch (err) {
    console.error('Scoring failed:', err)
    return NextResponse.json({ error: 'Could not score answers' }, { status: 400 })
  }

  const language: 'en' | 'es' = (candidate?.preferred_language ?? job?.language ?? 'en') === 'es' ? 'es' : 'en'

  const { error: upErr } = await supabaseAdmin
    .from('assessment_responses')
    .upsert({
      application_id: app.id,
      assessment_code: code,
      language,
      raw_answers,
      scores,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'application_id,assessment_code' })

  if (upErr) {
    console.error('Assessment upsert failed:', upErr)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  logAudit({
    action: 'assessment.completed',
    actorType: 'candidate',
    resourceType: 'application',
    resourceId: app.id,
    details: { code },
  })

  return NextResponse.json({ ok: true })
}
