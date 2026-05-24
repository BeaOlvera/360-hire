import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST, skip the CV upload step. Sets cv_url to a sentinel value so the
 * gate router treats it as "moved past CV" without storing a file.
 */
export async function POST(_request: NextRequest, { params }: { params: { token: string } }) {
  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select('id, cv_url, status')
    .eq('token', params.token)
    .single()
  if (error || !app) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  if (app.status === 'completed') return NextResponse.json({ error: 'Application already completed' }, { status: 400 })
  if (app.cv_url) return NextResponse.json({ ok: true, already: true })

  const { error: uErr } = await supabaseAdmin
    .from('applications')
    .update({ cv_url: 'SKIPPED' })
    .eq('id', app.id)
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
