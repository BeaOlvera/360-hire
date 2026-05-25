import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { sendCandidateInvite } from '@/lib/email'

/**
 * POST, resend the invitation email to the candidate for this application.
 * Reuses sendCandidateInvite with the same args used at first invite.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select(`
      id, token, status, job_id,
      jobs ( title ),
      candidates ( first_name, surname1, email, preferred_language )
    `)
    .eq('id', params.id)
    .single()
  if (error || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  if (app.status === 'completed' || app.status === 'reviewed' || app.status === 'hired' || app.status === 'rejected') {
    return NextResponse.json({ error: 'Application is already closed' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = app.jobs as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidate = app.candidates as any
  if (!candidate?.email) return NextResponse.json({ error: 'Candidate has no email on file' }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3003'
  const lang: 'en' | 'es' = candidate.preferred_language === 'es' ? 'es' : 'en'
  const fullName = [candidate.first_name, candidate.surname1].filter(Boolean).join(' ') || 'Candidate'
  const isGeneric = !app.job_id
  const titleForEmail = job?.title ?? ''

  try {
    await sendCandidateInvite(candidate.email, fullName, titleForEmail, null, app.token, appUrl, lang, isGeneric)
  } catch (err: any) {
    console.error('Resend invite failed:', err)
    return NextResponse.json({ error: err?.message ?? 'Could not send the email' }, { status: 500 })
  }

  logAudit({
    action: 'application.invited',
    actorType: 'admin',
    resourceType: 'application',
    resourceId: app.id,
    details: { resent: true, email: candidate.email },
  })

  return NextResponse.json({ ok: true, to: candidate.email })
}
