import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('token', params.token)
    .single()
  if (error || !app) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

  let body: any
  try { body = await request.json() } catch { body = {} }
  const consentText = body.consent_text ?? 'Candidate accepted the privacy notice.'

  const userAgent = request.headers.get('user-agent') ?? null
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null

  // Idempotent: if a consent row already exists for this application, do nothing.
  const { data: existing } = await supabaseAdmin
    .from('privacy_consents')
    .select('id')
    .eq('application_id', app.id)
    .eq('accepted', true)
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, already_recorded: true })
  }

  const { error: insertError } = await supabaseAdmin.from('privacy_consents').insert({
    application_id: app.id,
    consent_type: 'interview_processing',
    consent_text: consentText,
    accepted: true,
    accepted_at: new Date().toISOString(),
    ip_address: ipAddress,
    user_agent: userAgent,
  })

  if (insertError) {
    console.error('Consent insert failed:', insertError)
    return NextResponse.json({ error: insertError.message ?? 'Failed to record consent' }, { status: 500 })
  }

  logAudit({
    action: 'consent.accepted',
    actorType: 'candidate',
    resourceType: 'application',
    resourceId: app.id,
  })

  return NextResponse.json({ ok: true })
}
