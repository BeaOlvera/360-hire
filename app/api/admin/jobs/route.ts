import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { title, description, org_level, language, hiring_manager, assessments, culture_profile, competencies } = body
  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
  }
  if (!['en', 'es'].includes(language)) {
    return NextResponse.json({ error: 'Language must be en or es' }, { status: 400 })
  }
  const ALLOWED_ASSESSMENTS = ['thinking_style', 'growth_orientation', 'career_values', 'culture_fit', 'big_five', 'icar_reasoning', 'resilience']
  const cleanAssessments: string[] = Array.isArray(assessments)
    ? assessments.filter((c: unknown) => typeof c === 'string' && ALLOWED_ASSESSMENTS.includes(c))
    : []

  // Validate culture_profile if provided
  let cleanCulture: Record<string, number> | null = null
  if (culture_profile && typeof culture_profile === 'object') {
    const types = ['CLAN', 'ADHOCRACY', 'MARKET', 'HIERARCHY']
    const profile: Record<string, number> = {}
    let total = 0
    for (const t of types) {
      const v = Number(culture_profile[t] ?? 0)
      if (!Number.isFinite(v) || v < 0 || v > 100) {
        return NextResponse.json({ error: `Invalid culture_profile.${t} value` }, { status: 400 })
      }
      profile[t] = v
      total += v
    }
    if (total !== 100) return NextResponse.json({ error: 'culture_profile must sum to 100' }, { status: 400 })
    cleanCulture = profile
  }

  // Validate competencies
  const cleanCompetencies = Array.isArray(competencies)
    ? competencies
        .filter((c: any) => c && typeof c.name === 'string' && c.name.trim().length > 0)
        .map((c: any) => ({
          name: String(c.name).trim().slice(0, 80),
          weight: [1, 2, 3].includes(Number(c.weight)) ? Number(c.weight) : 2,
          behaviours: Array.isArray(c.behaviours) ? c.behaviours.map((b: any) => String(b).trim()).filter((b: string) => b.length > 0).slice(0, 6) : [],
        }))
        .slice(0, 12)
    : []

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .insert({
      title: title.trim(),
      description: description.trim(),
      org_level: org_level ?? null,
      language,
      hiring_manager: hiring_manager ?? null,
      assessments: cleanAssessments,
      culture_profile: cleanCulture,
      competencies: cleanCompetencies,
    })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create job' }, { status: 500 })
  }

  logAudit({ action: 'job.created', actorType: 'admin', resourceType: 'job', resourceId: data.id, details: { title } })

  return NextResponse.json({ id: data.id }, { status: 201 })
}
