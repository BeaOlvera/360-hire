import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { synthesizeCandidate, generateComprehensiveHTML, type AssessmentSnapshot } from '@/lib/generate_comprehensive_report'
import { getAssessment } from '@/lib/assessments'
import type { FitResult } from '@/lib/score_fit'

export const maxDuration = 300

/**
 * GET, produce the Comprehensive Candidate Report on demand.
 * Synthesises the JD + competencies + CV + transcript + existing fit-scoring + all
 * completed complementary assessments into one HTML page that opens with an
 * executive summary and a final recommendation, then drills into each signal.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select(`
      id, status, cv_text, score_data, completed_at, recommendation, fit_score, competencies_override,
      jobs ( title, description, org_level, language, competencies ),
      candidates ( first_name, surname1, surname2, preferred_language )
    `)
    .eq('id', params.id)
    .single()
  if (error || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = app.jobs as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidate = app.candidates as any
  if (!job) return NextResponse.json({ error: 'This evaluation has no job attached. Convert it to a job-fit first.' }, { status: 400 })

  const candidateName = [candidate?.first_name, candidate?.surname1, candidate?.surname2].filter(Boolean).join(' ') || 'Candidate'
  const language: 'en' | 'es' = (candidate?.preferred_language ?? job?.language ?? 'en') === 'es' ? 'es' : 'en'

  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('role, content')
    .eq('application_id', app.id)
    .order('created_at', { ascending: true })

  const transcript = (messages ?? []).map((m) => ({ role: m.role as 'assistant' | 'user', content: m.content }))

  const { data: assessmentRows } = await supabaseAdmin
    .from('assessment_responses')
    .select('assessment_code, scores')
    .eq('application_id', app.id)

  const assessments: AssessmentSnapshot[] = (assessmentRows ?? []).map((r) => {
    const def = getAssessment(r.assessment_code)
    return {
      code: r.assessment_code,
      name: def ? def.name[language] : r.assessment_code,
      scores: r.scores,
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const competenciesOverride = Array.isArray((app as any).competencies_override) ? (app as any).competencies_override : null
  const jobCompetencies: Array<{ name: string; weight?: number }> = competenciesOverride
    ? competenciesOverride.map((c: any) => ({ name: String(c.name ?? ''), weight: Number(c.weight ?? 2) }))
    : (Array.isArray(job?.competencies)
        ? job.competencies.map((c: any) => ({ name: String(c.name ?? ''), weight: Number(c.weight ?? 2) }))
        : [])

  let result
  try {
    result = await synthesizeCandidate({
      applicationId: app.id,
      jobTitle: job.title ?? 'the role',
      jobDescription: job.description ?? '',
      jobCompetencies,
      candidateName,
      cvText: app.cv_text ?? null,
      transcript,
      fitResult: (app.score_data ?? null) as FitResult | null,
      assessments,
      language,
    })
  } catch (err) {
    console.error('Comprehensive synthesis failed:', err)
    return NextResponse.json({ error: 'Failed to synthesise comprehensive report' }, { status: 500 })
  }

  const html = generateComprehensiveHTML({
    candidateName,
    jobTitle: job.title ?? '',
    orgLevel: job.org_level ?? null,
    completedAt: app.completed_at,
    result,
    transcript,
    assessments,
    language,
  })

  logAudit({
    action: 'report.generated',
    actorType: 'admin',
    resourceType: 'application',
    resourceId: app.id,
    details: { kind: 'comprehensive' },
  })

  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
