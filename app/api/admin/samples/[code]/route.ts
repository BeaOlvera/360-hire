import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { getAssessment, ASSESSMENT_CODES, type AssessmentCode } from '@/lib/assessments'
import { generateReportHTML } from '@/lib/generate_report'
import { generateComprehensiveHTML, type AssessmentSnapshot } from '@/lib/generate_comprehensive_report'
import {
  SAMPLE_CANDIDATE_NAME, SAMPLE_JOB_TITLE, SAMPLE_ORG_LEVEL, SAMPLE_LANGUAGE,
  SAMPLE_FIT_RESULT, SAMPLE_COMPREHENSIVE_RESULT,
  SAMPLE_TRANSCRIPT, SAMPLE_RAW_ANSWERS,
} from '@/lib/samples/fixtures'

const SAMPLE_COMPLETED_AT = '2026-03-15T11:42:00.000Z'

/**
 * GET, return a sample report HTML for the given code.
 * Codes: each assessment code, plus 'fit_report' and 'comprehensive'.
 * Uses hardcoded fictional candidate data so we never have to hit the LLM.
 */
export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  const code = params.code
  const baseArgs = {
    candidateName: SAMPLE_CANDIDATE_NAME,
    jobTitle: SAMPLE_JOB_TITLE,
    completedAt: SAMPLE_COMPLETED_AT,
    language: SAMPLE_LANGUAGE,
  }

  // The 7 complementary-assessment reports
  if (ASSESSMENT_CODES.includes(code as AssessmentCode)) {
    const def = getAssessment(code)
    if (!def) return NextResponse.json({ error: 'Unknown assessment' }, { status: 400 })
    const raw = SAMPLE_RAW_ANSWERS[code]
    if (!raw) return NextResponse.json({ error: 'No sample data for this assessment' }, { status: 500 })
    const scores = def.score(raw)
    // culture_fit needs the companyProfile too; pass it through generateHtml's extra args
    const html = (def.generateHtml as any)({
      ...baseArgs,
      scores,
      companyProfile: code === 'culture_fit' ? { CLAN: 20, ADHOCRACY: 35, MARKET: 25, HIERARCHY: 20 } : undefined,
    })
    return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  // Fit report (job-fit scoring)
  if (code === 'fit_report') {
    const html = generateReportHTML({
      candidateName: SAMPLE_CANDIDATE_NAME,
      jobTitle: SAMPLE_JOB_TITLE,
      orgLevel: SAMPLE_ORG_LEVEL,
      interviewedAt: SAMPLE_COMPLETED_AT,
      result: SAMPLE_FIT_RESULT,
      language: SAMPLE_LANGUAGE,
    })
    return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  // Comprehensive report (synthesis)
  if (code === 'comprehensive') {
    // Build assessment snapshots from the sample raw answers so the "assessments at-a-glance" section is realistic
    const snapshots: AssessmentSnapshot[] = []
    for (const c of ASSESSMENT_CODES) {
      const def = getAssessment(c)
      const raw = SAMPLE_RAW_ANSWERS[c]
      if (!def || !raw) continue
      snapshots.push({ code: c, name: def.name[SAMPLE_LANGUAGE], scores: def.score(raw) })
    }
    const html = generateComprehensiveHTML({
      candidateName: SAMPLE_CANDIDATE_NAME,
      jobTitle: SAMPLE_JOB_TITLE,
      orgLevel: SAMPLE_ORG_LEVEL,
      completedAt: SAMPLE_COMPLETED_AT,
      result: SAMPLE_COMPREHENSIVE_RESULT,
      transcript: SAMPLE_TRANSCRIPT,
      assessments: snapshots,
      language: SAMPLE_LANGUAGE,
    })
    return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  return NextResponse.json({ error: 'Unknown sample code' }, { status: 400 })
}
