import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { first_name, surname1, surname2, email, preferred_language } = body
  if (!first_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'First name and email are required' }, { status: 400 })
  }
  const normalizedEmail = email.trim().toLowerCase()
  const lang: 'en' | 'es' = preferred_language === 'es' ? 'es' : 'en'

  const { data: existing } = await supabaseAdmin
    .from('candidates')
    .select('id')
    .eq('email', normalizedEmail)
    .limit(1)
    .maybeSingle()

  if (existing) return NextResponse.json({ id: existing.id, already_exists: true }, { status: 200 })

  const { data, error } = await supabaseAdmin
    .from('candidates')
    .insert({
      first_name: first_name.trim(),
      surname1: surname1?.trim() || null,
      surname2: surname2?.trim() || null,
      email: normalizedEmail,
      preferred_language: lang,
    })
    .select('id')
    .single()
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 })

  logAudit({ action: 'job.created' /* re-using as a placeholder */, actorType: 'admin', resourceType: 'candidate', resourceId: data.id, details: { email: normalizedEmail } })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
