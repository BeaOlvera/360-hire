import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'

/**
 * GET, return application context for the candidate-facing portal.
 * Used to drive the page (consent gate, CV upload, chat).
 */
export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select(`
      id, job_id, candidate_id, status, cv_url, video_url, completed_at,
      jobs ( id, title, description, org_level, language ),
      candidates ( id, first_name, surname1, surname2, email, preferred_language )
    `)
    .eq('token', params.token)
    .single()

  if (error || !app) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  }

  const { data: consent } = await supabaseAdmin
    .from('privacy_consents')
    .select('id')
    .eq('application_id', app.id)
    .eq('accepted', true)
    .limit(1)
    .maybeSingle()

  logAudit({
    action: 'application.accessed',
    actorType: 'candidate',
    resourceType: 'application',
    resourceId: app.id,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = app.jobs as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidate = app.candidates as any
  const candidateFirstName = candidate?.first_name ?? 'Candidate'
  const candidateFullName = [candidate?.first_name, candidate?.surname1, candidate?.surname2].filter(Boolean).join(' ')

  return NextResponse.json({
    application: {
      id: app.id,
      status: app.status,
      has_consent: !!consent,
      has_cv: !!app.cv_url,
      completed_at: app.completed_at,
    },
    job: {
      id: job?.id,
      title: job?.title,
      org_level: job?.org_level,
      language: job?.language ?? 'en',
    },
    candidate: {
      firstName: candidateFirstName,
      fullName: candidateFullName,
      email: candidate?.email,
      language: candidate?.preferred_language ?? job?.language ?? 'en',
    },
  })
}
