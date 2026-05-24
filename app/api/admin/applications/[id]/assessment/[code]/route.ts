import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { getAssessment, ASSESSMENT_CODES, type AssessmentCode } from '@/lib/assessments'

/**
 * GET, serve the rendered HTML report for one assessment of one application.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string; code: string } }) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  if (!ASSESSMENT_CODES.includes(params.code as AssessmentCode)) {
    return NextResponse.json({ error: 'Unknown assessment' }, { status: 400 })
  }

  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select(`
      id,
      jobs ( title ),
      candidates ( first_name, surname1, surname2 )
    `)
    .eq('id', params.id)
    .single()
  if (error || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const { data: response } = await supabaseAdmin
    .from('assessment_responses')
    .select('scores, language, completed_at')
    .eq('application_id', params.id)
    .eq('assessment_code', params.code)
    .maybeSingle()

  if (!response) return NextResponse.json({ error: 'Assessment not completed yet' }, { status: 404 })

  const def = getAssessment(params.code)
  if (!def) return NextResponse.json({ error: 'Unknown assessment' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = app.jobs as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidate = app.candidates as any
  const candidateName = [candidate?.first_name, candidate?.surname1, candidate?.surname2].filter(Boolean).join(' ') || 'Candidate'
  const language: 'en' | 'es' = response.language === 'es' ? 'es' : 'en'

  const html = def.generateHtml({
    scores: response.scores,
    candidateName,
    jobTitle: job?.title ?? '',
    completedAt: response.completed_at,
    language,
  })

  logAudit({ action: 'report.viewed', actorType: 'admin', resourceType: 'application', resourceId: app.id, details: { assessment: params.code } })

  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
