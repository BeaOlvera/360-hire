import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { generateReportHTML } from '@/lib/generate_report'
import type { FitResult } from '@/lib/score_fit'

const ALLOWED_RECS = ['strong_hire', 'hire', 'maybe', 'no_hire'] as const
const ALLOWED_STATUSES = ['completed', 'reviewed', 'hired', 'rejected'] as const

/**
 * PATCH, admin override of recommendation, status, or review notes.
 * If the recommendation changes, regenerate the saved report_html from
 * the stored structured FitResult (score_data) so the downloadable report
 * matches the admin's final decision.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const update: Record<string, any> = {}
  if (body.recommendation !== undefined) {
    if (body.recommendation !== null && !ALLOWED_RECS.includes(body.recommendation)) {
      return NextResponse.json({ error: 'Invalid recommendation' }, { status: 400 })
    }
    update.recommendation = body.recommendation
  }
  if (body.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    update.status = body.status
  }
  if (body.review_notes !== undefined) {
    update.review_notes = body.review_notes ? String(body.review_notes) : null
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // If recommendation changed, regenerate the report HTML from stored score_data
  if (update.recommendation !== undefined) {
    const { data: app } = await supabaseAdmin
      .from('applications')
      .select(`
        id, score_data, completed_at, recommendation,
        jobs ( title, org_level, language ),
        candidates ( first_name, surname1, surname2, preferred_language )
      `)
      .eq('id', params.id)
      .single()

    if (app?.score_data && update.recommendation !== app.recommendation) {
      const fit = app.score_data as FitResult
      const patched: FitResult = { ...fit, recommendation: update.recommendation }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const job = app.jobs as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const candidate = app.candidates as any
      const candidateName = [candidate?.first_name, candidate?.surname1, candidate?.surname2].filter(Boolean).join(' ') || 'Candidate'
      const language: 'en' | 'es' = (candidate?.preferred_language ?? job?.language ?? 'en') === 'es' ? 'es' : 'en'

      update.score_data = patched
      update.report_html = generateReportHTML({
        candidateName,
        jobTitle: job?.title ?? '',
        orgLevel: job?.org_level ?? null,
        interviewedAt: app.completed_at,
        result: patched,
        language,
      })
    }
  }

  update.reviewed_at = new Date().toISOString()
  const { error } = await supabaseAdmin.from('applications').update(update).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAudit({
    action: 'application.recommendation_set',
    actorType: 'admin',
    resourceType: 'application',
    resourceId: params.id,
    details: {
      recommendation: update.recommendation,
      status: update.status,
      review_notes_changed: 'review_notes' in update,
      report_regenerated: 'report_html' in update,
    },
  })

  return NextResponse.json({ ok: true, report_regenerated: 'report_html' in update })
}
