import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { sendCandidateInvite } from '@/lib/email'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { first_name, surname1, surname2, email, preferred_language } = body
  if (!first_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'First name and email are required' }, { status: 400 })
  }
  const lang: 'en' | 'es' = preferred_language === 'es' ? 'es' : 'en'

  const { data: job, error: jobError } = await supabaseAdmin
    .from('jobs')
    .select('id, title, language, hiring_manager, status')
    .eq('id', params.id)
    .single()

  if (jobError || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.status !== 'open') return NextResponse.json({ error: 'Job is not open' }, { status: 400 })

  const normalizedEmail = email.trim().toLowerCase()

  // Find or create candidate by email
  const { data: existing } = await supabaseAdmin
    .from('candidates')
    .select('id, first_name, surname1, surname2, preferred_language')
    .eq('email', normalizedEmail)
    .limit(1)
    .maybeSingle()

  let candidateId: string
  if (existing) {
    candidateId = existing.id
  } else {
    const { data: newCand, error: cErr } = await supabaseAdmin
      .from('candidates')
      .insert({
        first_name: first_name.trim(),
        surname1: surname1?.trim() ?? null,
        surname2: surname2?.trim() ?? null,
        email: normalizedEmail,
        preferred_language: lang,
      })
      .select('id')
      .single()
    if (cErr || !newCand) return NextResponse.json({ error: cErr?.message ?? 'Failed to create candidate' }, { status: 500 })
    candidateId = newCand.id
  }

  // Check for existing application for this job + candidate
  const { data: existingApp } = await supabaseAdmin
    .from('applications')
    .select('id, token')
    .eq('job_id', params.id)
    .eq('candidate_id', candidateId)
    .limit(1)
    .maybeSingle()

  let token: string
  if (existingApp) {
    token = existingApp.token
  } else {
    const { data: newApp, error: aErr } = await supabaseAdmin
      .from('applications')
      .insert({
        job_id: params.id,
        candidate_id: candidateId,
      })
      .select('id, token')
      .single()
    if (aErr || !newApp) return NextResponse.json({ error: aErr?.message ?? 'Failed to create application' }, { status: 500 })
    token = newApp.token
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3003'

  try {
    const fullName = [first_name.trim(), surname1?.trim()].filter(Boolean).join(' ')
    await sendCandidateInvite(normalizedEmail, fullName, job.title, null, token, appUrl, lang)
  } catch (err) {
    console.error('Invite email failed:', err)
    // Don't fail the request; the admin can resend later.
  }

  logAudit({
    action: 'application.invited',
    actorType: 'admin',
    resourceType: 'job',
    resourceId: params.id,
    details: { candidate_id: candidateId, email: normalizedEmail },
  })

  return NextResponse.json({ ok: true, candidate_id: candidateId, token }, { status: 201 })
}
