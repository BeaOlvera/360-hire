import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { sendCandidateInvite } from '@/lib/email'
import { ASSESSMENT_CODES, type AssessmentCode } from '@/lib/assessments'

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

  // Optional per-invite overrides
  const assessmentsOverride: string[] | null = Array.isArray(body.assessments_override)
    ? body.assessments_override.filter((c: unknown) => typeof c === 'string' && (ASSESSMENT_CODES as readonly string[]).includes(c as AssessmentCode))
    : null
  const competenciesOverride: Array<{ name: string; weight: 1 | 2 | 3; behaviours?: string[] }> | null = Array.isArray(body.competencies_override)
    ? body.competencies_override
        .filter((c: any) => c && typeof c.name === 'string' && c.name.trim().length > 0)
        .map((c: any) => ({
          name: String(c.name).trim().slice(0, 80),
          weight: ([1, 2, 3] as const).includes(Number(c.weight) as 1 | 2 | 3) ? Number(c.weight) as 1 | 2 | 3 : 2,
          behaviours: Array.isArray(c.behaviours) ? c.behaviours.map((b: any) => String(b).trim()).filter((b: string) => b.length > 0).slice(0, 12) : [],
        })).slice(0, 15)
    : null

  const { data: job, error: jobError } = await supabaseAdmin
    .from('jobs')
    .select('id, title, language, hiring_manager, status, assessments')
    .eq('id', params.id)
    .single()

  if (jobError || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.status !== 'open') return NextResponse.json({ error: 'Job is not open' }, { status: 400 })

  // Validate assessments_override is a subset of job's assessments
  if (assessmentsOverride) {
    const jobAssessments: string[] = Array.isArray(job.assessments) ? job.assessments : []
    for (const code of assessmentsOverride) {
      if (!jobAssessments.includes(code)) {
        return NextResponse.json({ error: `Assessment ${code} is not enabled for this job` }, { status: 400 })
      }
    }
  }

  const normalizedEmail = email.trim().toLowerCase()

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
    const updatePayload: Record<string, any> = {}
    if (assessmentsOverride) updatePayload.assessments_override = assessmentsOverride
    if (competenciesOverride) updatePayload.competencies_override = competenciesOverride
    if (Object.keys(updatePayload).length > 0) {
      await supabaseAdmin.from('applications').update(updatePayload).eq('id', existingApp.id)
    }
  } else {
    const insertPayload: Record<string, any> = { job_id: params.id, candidate_id: candidateId }
    if (assessmentsOverride) insertPayload.assessments_override = assessmentsOverride
    if (competenciesOverride) insertPayload.competencies_override = competenciesOverride
    const { data: newApp, error: aErr } = await supabaseAdmin
      .from('applications')
      .insert(insertPayload)
      .select('id, token')
      .single()
    if (aErr || !newApp) return NextResponse.json({ error: aErr?.message ?? 'Failed to create application' }, { status: 500 })
    token = newApp.token
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3003'

  try {
    const fullName = [first_name.trim(), surname1?.trim()].filter(Boolean).join(' ')
    await sendCandidateInvite(normalizedEmail, fullName, job.title, null, token, appUrl, lang, false)
  } catch (err) {
    console.error('Invite email failed:', err)
  }

  logAudit({
    action: 'application.invited',
    actorType: 'admin',
    resourceType: 'job',
    resourceId: params.id,
    details: { candidate_id: candidateId, email: normalizedEmail, assessments_override: assessmentsOverride ?? undefined, competencies_override: competenciesOverride ? competenciesOverride.length : undefined },
  })

  return NextResponse.json({ ok: true, candidate_id: candidateId, token }, { status: 201 })
}
