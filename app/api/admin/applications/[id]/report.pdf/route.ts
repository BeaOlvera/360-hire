import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { renderHtmlToPdf } from '@/lib/pdf'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * GET, return the hiring report as a downloadable PDF.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select(`
      id, report_html,
      jobs ( title ),
      candidates ( first_name, surname1, surname2 )
    `)
    .eq('id', params.id)
    .single()
  if (error || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  if (!app.report_html) return NextResponse.json({ error: 'Report not generated yet' }, { status: 404 })

  let pdf: Buffer
  try {
    pdf = await renderHtmlToPdf(app.report_html)
  } catch (err: any) {
    console.error('PDF render failed:', err)
    return NextResponse.json({ error: err?.message ?? 'PDF render failed' }, { status: 500 })
  }

  logAudit({ action: 'report.generated', actorType: 'admin', resourceType: 'application', resourceId: app.id, details: { format: 'pdf' } })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = app.jobs as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidate = app.candidates as any
  const fullName = [candidate?.first_name, candidate?.surname1, candidate?.surname2].filter(Boolean).join('_') || 'candidate'
  const titleSlug = (job?.title ?? 'role').replace(/[^a-zA-Z0-9]+/g, '_')
  const filename = `360hire_${titleSlug}_${fullName}.pdf`

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
