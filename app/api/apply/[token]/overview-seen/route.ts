import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST, mark that the candidate has seen the assessment overview page.
 * Stores a row in privacy_consents as a low-friction marker (no schema migration needed).
 */
export async function POST(_request: NextRequest, { params }: { params: { token: string } }) {
  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select('id, status')
    .eq('token', params.token)
    .single()
  if (error || !app) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

  // Idempotent: only insert if not already seen
  const { data: existing } = await supabaseAdmin
    .from('privacy_consents')
    .select('id')
    .eq('application_id', app.id)
    .eq('consent_type', 'overview_seen')
    .limit(1)
    .maybeSingle()

  if (existing) return NextResponse.json({ ok: true, already: true })

  await supabaseAdmin.from('privacy_consents').insert({
    application_id: app.id,
    consent_type: 'overview_seen',
    consent_text: 'Overview shown',
    accepted: true,
    accepted_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}
