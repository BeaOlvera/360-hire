import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

/**
 * GET, serve the saved hiring report as HTML for in-tab viewing or print.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select('id, report_html')
    .eq('id', params.id)
    .single()
  if (error || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  if (!app.report_html) return NextResponse.json({ error: 'Report not generated yet' }, { status: 404 })

  logAudit({ action: 'report.viewed', actorType: 'admin', resourceType: 'application', resourceId: app.id })

  return new NextResponse(app.report_html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
